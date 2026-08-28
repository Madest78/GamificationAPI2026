import 'dotenv/config';
import { readFileSync } from 'fs';
import { prisma } from '@/shared/prisma.js';
import { SlackAdapter } from '@/shared/slack/adapter.js';

async function main() {
    console.log('[SlackSyncV2] Starting...');
    const adapter = new SlackAdapter();
    const allSlackUsers = await adapter.getAllUsers();
    console.log(`[SlackSyncV2] Fetched ${allSlackUsers.length} Slack users`);

    const emailToSlack = new Map<string, { id: string; avatarUrl?: string }>();
    for (const su of allSlackUsers) {
        const email = su.profile?.email?.toLowerCase();
        if (email && !su.deleted && !su.is_bot) {
            emailToSlack.set(email, {
                id: su.id,
                avatarUrl: su.profile?.image_192 || su.profile?.image_72,
            });
        }
    }
    console.log(`[SlackSyncV2] ${emailToSlack.size} active Slack users with email`);

    const dbUsers = await prisma.user.findMany({
        select: { id: true, email: true, slackId: true, avatarUrl: true },
    });

    let matched = 0, updated = 0, alreadyLinked = 0;
    const updates: Array<{ userId: string; slackId: string; avatarUrl: string }> = [];

    for (const user of dbUsers) {
        const slackInfo = emailToSlack.get(user.email.toLowerCase());
        if (!slackInfo) continue;
        matched++;
        if (user.slackId && user.avatarUrl) { alreadyLinked++; continue; }
        updates.push({ userId: user.id, slackId: slackInfo.id, avatarUrl: slackInfo.avatarUrl || '' });
    }

    console.log(`[SlackSyncV2] Matched: ${matched}, Already linked: ${alreadyLinked}, To update: ${updates.length}`);

    for (let i = 0; i < updates.length; i += 50) {
        const batch = updates.slice(i, i + 50);
        for (const u of batch) {
            await prisma.user.update({
                where: { id: u.userId },
                data: { slackId: u.slackId, avatarUrl: u.avatarUrl || undefined },
            });
            updated++;
        }
        console.log(`[SlackSyncV2] Updated ${Math.min(i + 50, updates.length)}/${updates.length}`);
    }

    const finalSlack = await prisma.user.count({ where: { slackId: { not: null } } });
    console.log(`[SlackSyncV2] Done. ${updated} updated. Total with slackId: ${finalSlack}`);
    await prisma.$disconnect();
}

main().catch(err => { console.error('[SlackSyncV2] Fatal:', err); process.exit(1); });
