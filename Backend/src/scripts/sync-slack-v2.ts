import 'dotenv/config';
import { SlackAdapter } from '@/shared/slack/adapter.js';
import { prisma } from '@/shared/prisma.js';

function escapeSQL(s: string): string {
    return s.replace(/'/g, "''");
}

async function main() {
    const adapter = new SlackAdapter();
    const allSlackUsers = await adapter.getAllUsers();

    const slackByEmail = new Map<string, { id: string; avatar?: string }>();
    for (const su of allSlackUsers) {
        if (su.deleted || su.is_bot) continue;
        const email = su.profile?.email?.toLowerCase();
        if (email) slackByEmail.set(email, { id: su.id, avatar: su.profile?.image_192 });
    }
    console.log('Active Slack users with email:', slackByEmail.size);

    const dbUsers = await prisma.user.findMany({
        select: { id: true, email: true, personalEmail: true, slackId: true },
    });
    console.log('DB users:', dbUsers.length);

    // Build update list
    const updates: Array<{ userId: string; slackId: string; avatarUrl: string }> = [];
    const usedSlackIds = new Set<string>();

    // Priority 1: primary email match
    for (const user of dbUsers) {
        if (user.slackId) { usedSlackIds.add(user.slackId); continue; }
        const match = slackByEmail.get(user.email.toLowerCase());
        if (match && !usedSlackIds.has(match.id)) {
            updates.push({ userId: user.id, slackId: match.id, avatarUrl: match.avatar || '' });
            usedSlackIds.add(match.id);
        }
    }
    console.log('Primary email matches:', updates.length);

    // Priority 2: personalEmail match
    let personalMatches = 0;
    for (const user of dbUsers) {
        if (user.slackId || updates.some(u => u.userId === user.id)) continue;
        if (!user.personalEmail) continue;
        const match = slackByEmail.get(user.personalEmail.toLowerCase());
        if (match && !usedSlackIds.has(match.id)) {
            updates.push({ userId: user.id, slackId: match.id, avatarUrl: match.avatar || '' });
            usedSlackIds.add(match.id);
            personalMatches++;
        }
    }
    console.log('Personal email matches:', personalMatches);
    console.log('Total to update:', updates.length);

    // Batch SQL update
    for (let i = 0; i < updates.length; i += 50) {
        const batch = updates.slice(i, i + 50);
        const cases = batch.map(u =>
            `WHEN id='${escapeSQL(u.userId)}' THEN '${escapeSQL(u.slackId)}'`
        ).join(' ');
        const avatarCases = batch.map(u =>
            `WHEN id='${escapeSQL(u.userId)}' THEN '${escapeSQL(u.avatarUrl)}'`
        ).join(' ');
        const ids = batch.map(u => `'${escapeSQL(u.userId)}'`).join(',');

        await prisma.$executeRawUnsafe(
            `UPDATE "User" SET "slackId" = CASE ${cases} END, "avatarUrl" = CASE ${avatarCases} END WHERE id IN (${ids})`
        );
        console.log(`Updated ${Math.min(i + 50, updates.length)}/${updates.length}`);
    }

    const finalSlack = await prisma.user.count({ where: { slackId: { not: null } } });
    console.log(`\nDone. Total with slackId: ${finalSlack}/${dbUsers.length}`);
    await prisma.$disconnect();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
