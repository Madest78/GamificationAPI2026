import { SlackAdapter, SlackUser } from './adapter.js';
import { UserRepository } from '@/modules/users/user.repository.js';
import { prisma } from '@/shared/prisma.js';

export class SlackSyncService {
    private slack: SlackAdapter;

    constructor(private userRepo: UserRepository) {
        this.slack = new SlackAdapter();
    }

    async syncUserByEmail(email: string): Promise<{ updated: boolean; slackId?: string }> {
        const user = await this.userRepo.findByEmail(email);
        if (!user) {
            return { updated: false };
        }

        // Try primary email first, then personalEmail
        let slackUser = await this.slack.getUserByEmail(email);
        if (!slackUser && user.personalEmail) {
            slackUser = await this.slack.getUserByEmail(user.personalEmail);
        }
        if (!slackUser) {
            return { updated: false };
        }

        const updates: { slackId?: string; avatarUrl24?: string; avatarUrl32?: string; avatarUrl48?: string; avatarUrl72?: string; avatarUrl192?: string; avatarUrl512?: string } = {};

        if (!user.slackId) {
            updates.slackId = slackUser.id;
        }

        if (slackUser.profile.image_24) updates.avatarUrl24 = slackUser.profile.image_24;
        if (slackUser.profile.image_32) updates.avatarUrl32 = slackUser.profile.image_32;
        if (slackUser.profile.image_48) updates.avatarUrl48 = slackUser.profile.image_48;
        if (slackUser.profile.image_72) updates.avatarUrl72 = slackUser.profile.image_72;
        if (slackUser.profile.image_192) updates.avatarUrl192 = slackUser.profile.image_192;
        if (slackUser.profile.image_512) updates.avatarUrl512 = slackUser.profile.image_512;

        if (Object.keys(updates).length > 0) {
            await this.userRepo.update(user.id, updates);
            return { updated: true, ...updates };
        }

        return { updated: false };
    }

    /**
     * Bulk Slack sync: get all Slack users, match by email OR personalEmail, update in batch.
     * ~2 API calls (Slack paginated) + ~3 DB queries.
     */
    async syncAllUsers(): Promise<{ synced: number; errors: number }> {
        // 1) Fetch all Slack users
        const slackUsers = await this.slack.getAllUsers();
        console.log(`[SlackSync] Fetched ${slackUsers.length} Slack users`);

        // 2) Build email → SlackUser map
        const emailToSlack = new Map<string, SlackUser>();
        for (const su of slackUsers) {
            if (su.profile.email) {
                emailToSlack.set(su.profile.email.toLowerCase(), su);
            }
        }
        console.log(`[SlackSync] ${emailToSlack.size} Slack users with email`);

        // 3) Fetch all DB users (include personalEmail for matching)
        const dbUsers = await prisma.user.findMany({
            select: { id: true, email: true, personalEmail: true, slackId: true },
        });
        console.log(`[SlackSync] ${dbUsers.length} DB users`);

        // 4) Compute updates in memory — match by email OR personalEmail
        const toUpdate: Array<{ id: string; slackId?: string; avatarUrl24?: string; avatarUrl32?: string; avatarUrl48?: string; avatarUrl72?: string; avatarUrl192?: string; avatarUrl512?: string }> = [];
        const usedSlackIds = new Set<string>();

        for (const dbUser of dbUsers) {
            // Try matching by primary email first, then by personalEmail
            const slackUser = emailToSlack.get(dbUser.email.toLowerCase())
                || (dbUser.personalEmail ? emailToSlack.get(dbUser.personalEmail.toLowerCase()) : null);

            if (!slackUser) continue;

            // Skip if this Slack user is already linked to another DB user
            if (usedSlackIds.has(slackUser.id)) continue;
            usedSlackIds.add(slackUser.id);

            const updates: { slackId?: string; avatarUrl24?: string; avatarUrl32?: string; avatarUrl48?: string; avatarUrl72?: string; avatarUrl192?: string; avatarUrl512?: string } = {};

            if (!dbUser.slackId) {
                updates.slackId = slackUser.id;
            }

            if (slackUser.profile.image_24) updates.avatarUrl24 = slackUser.profile.image_24;
            if (slackUser.profile.image_32) updates.avatarUrl32 = slackUser.profile.image_32;
            if (slackUser.profile.image_48) updates.avatarUrl48 = slackUser.profile.image_48;
            if (slackUser.profile.image_72) updates.avatarUrl72 = slackUser.profile.image_72;
            if (slackUser.profile.image_192) updates.avatarUrl192 = slackUser.profile.image_192;
            if (slackUser.profile.image_512) updates.avatarUrl512 = slackUser.profile.image_512;

            if (Object.keys(updates).length > 0) {
                toUpdate.push({ id: dbUser.id, ...updates });
            }
        }

        console.log(`[SlackSync] ${toUpdate.length} users to update`);

        // 5) Bulk update
        let synced = 0;
        let errors = 0;

        for (let i = 0; i < toUpdate.length; i += 10) {
            const batch = toUpdate.slice(i, i + 10);
            try {
                await prisma.$transaction(
                    batch.map((u) =>
                        prisma.user.update({
                            where: { id: u.id },
                            data: { slackId: u.slackId, avatarUrl24: u.avatarUrl24, avatarUrl32: u.avatarUrl32, avatarUrl48: u.avatarUrl48, avatarUrl72: u.avatarUrl72, avatarUrl192: u.avatarUrl192, avatarUrl512: u.avatarUrl512 },
                        })
                    ),
                    { timeout: 30000 },
                );
                synced += batch.length;
            } catch (error) {
                console.error(`[SlackSync] Batch ${i} failed:`, error);
                errors += batch.length;
            }
        }

        console.log(`[SlackSync] Done: ${synced} synced, ${errors} errors`);
        return { synced, errors };
    }
}
