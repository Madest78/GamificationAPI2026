import 'dotenv/config';
import { SlackAdapter } from '@/shared/slack/adapter.js';
import { prisma } from '@/shared/prisma.js';

function escapeSQL(s: string): string {
    return s.replace(/'/g, "''");
}

async function main() {
    const adapter = new SlackAdapter();
    const allSlackUsers = await adapter.getAllUsers();

    const slackByEmail = new Map<string, { id: string; avatars: { image_24?: string; image_32?: string; image_48?: string; image_72?: string; image_192?: string; image_512?: string } }>();
    for (const su of allSlackUsers) {
        if (su.deleted || su.is_bot) continue;
        const email = su.profile?.email?.toLowerCase();
        if (email) slackByEmail.set(email, {
            id: su.id,
            avatars: {
                image_24: su.profile?.image_24,
                image_32: su.profile?.image_32,
                image_48: su.profile?.image_48,
                image_72: su.profile?.image_72,
                image_192: su.profile?.image_192,
                image_512: su.profile?.image_512,
            },
        });
    }
    console.log('Active Slack users with email:', slackByEmail.size);

    const dbUsers = await prisma.user.findMany({
        select: { id: true, email: true, personalEmail: true, slackId: true },
    });
    console.log('DB users:', dbUsers.length);

    // Build update list
    const updates: Array<{ userId: string; slackId: string; avatarUrl24: string; avatarUrl32: string; avatarUrl48: string; avatarUrl72: string; avatarUrl192: string; avatarUrl512: string }> = [];
    const usedSlackIds = new Set<string>();

    // Priority 1: primary email match
    for (const user of dbUsers) {
        if (user.slackId) { usedSlackIds.add(user.slackId); continue; }
        const match = slackByEmail.get(user.email.toLowerCase());
        if (match && !usedSlackIds.has(match.id)) {
            updates.push({
                userId: user.id,
                slackId: match.id,
                avatarUrl24: match.avatars.image_24 || '',
                avatarUrl32: match.avatars.image_32 || '',
                avatarUrl48: match.avatars.image_48 || '',
                avatarUrl72: match.avatars.image_72 || '',
                avatarUrl192: match.avatars.image_192 || '',
                avatarUrl512: match.avatars.image_512 || '',
            });
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
            updates.push({
                userId: user.id,
                slackId: match.id,
                avatarUrl24: match.avatars.image_24 || '',
                avatarUrl32: match.avatars.image_32 || '',
                avatarUrl48: match.avatars.image_48 || '',
                avatarUrl72: match.avatars.image_72 || '',
                avatarUrl192: match.avatars.image_192 || '',
                avatarUrl512: match.avatars.image_512 || '',
            });
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
        const avatar24Cases = batch.map(u =>
            `WHEN id='${escapeSQL(u.userId)}' THEN '${escapeSQL(u.avatarUrl24)}'`
        ).join(' ');
        const avatar32Cases = batch.map(u =>
            `WHEN id='${escapeSQL(u.userId)}' THEN '${escapeSQL(u.avatarUrl32)}'`
        ).join(' ');
        const avatar48Cases = batch.map(u =>
            `WHEN id='${escapeSQL(u.userId)}' THEN '${escapeSQL(u.avatarUrl48)}'`
        ).join(' ');
        const avatar72Cases = batch.map(u =>
            `WHEN id='${escapeSQL(u.userId)}' THEN '${escapeSQL(u.avatarUrl72)}'`
        ).join(' ');
        const avatar192Cases = batch.map(u =>
            `WHEN id='${escapeSQL(u.userId)}' THEN '${escapeSQL(u.avatarUrl192)}'`
        ).join(' ');
        const avatar512Cases = batch.map(u =>
            `WHEN id='${escapeSQL(u.userId)}' THEN '${escapeSQL(u.avatarUrl512)}'`
        ).join(' ');
        const ids = batch.map(u => `'${escapeSQL(u.userId)}'`).join(',');

        await prisma.$executeRawUnsafe(
            `UPDATE "User" SET "slackId" = CASE ${cases} END, "avatarUrl24" = CASE ${avatar24Cases} END, "avatarUrl32" = CASE ${avatar32Cases} END, "avatarUrl48" = CASE ${avatar48Cases} END, "avatarUrl72" = CASE ${avatar72Cases} END, "avatarUrl192" = CASE ${avatar192Cases} END, "avatarUrl512" = CASE ${avatar512Cases} END WHERE id IN (${ids})`
        );
        console.log(`Updated ${Math.min(i + 50, updates.length)}/${updates.length}`);
    }

    const finalSlack = await prisma.user.count({ where: { slackId: { not: null } } });
    console.log(`\nDone. Total with slackId: ${finalSlack}/${dbUsers.length}`);
    await prisma.$disconnect();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
