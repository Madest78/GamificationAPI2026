import { SlackAdapter, SlackUser } from './adapter.js';
import { UserRepository } from '@/modules/users/user.repository.js';
import { prisma } from '@/shared/prisma.js';

export class SlackSyncService {
    private slack: SlackAdapter;

    constructor(private userRepo: UserRepository) {
        this.slack = new SlackAdapter();
    }

    async syncUserByEmail(email: string): Promise<{ updated: boolean; slackId?: string; avatarUrl?: string }> {
        const user = await this.userRepo.findByEmail(email);
        if (!user) {
            return { updated: false };
        }

        const slackUser = await this.slack.getUserByEmail(email);
        if (!slackUser) {
            return { updated: false };
        }

        const updates: { slackId?: string; avatarUrl?: string } = {};

        if (!user.slackId) {
            updates.slackId = slackUser.id;
        }

        if (!user.avatarUrl && slackUser.profile.image_192) {
            updates.avatarUrl = slackUser.profile.image_192;
        }

        if (Object.keys(updates).length > 0) {
            await this.userRepo.update(user.id, updates);
            return { updated: true, ...updates };
        }

        return { updated: false };
    }

    /**
     * Bulk Slack sync: get all Slack users, match by email, update in batch.
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

        // 3) Fetch all DB users
        const dbUsers = await prisma.user.findMany({
            select: { id: true, email: true, slackId: true, avatarUrl: true },
        });
        console.log(`[SlackSync] ${dbUsers.length} DB users`);

        // 4) Compute updates in memory
        const toUpdate: Array<{ id: string; slackId?: string; avatarUrl?: string }> = [];

        for (const dbUser of dbUsers) {
            const slackUser = emailToSlack.get(dbUser.email.toLowerCase());
            if (!slackUser) continue;

            const updates: { slackId?: string; avatarUrl?: string } = {};

            if (!dbUser.slackId) {
                updates.slackId = slackUser.id;
            }

            if (!dbUser.avatarUrl && slackUser.profile.image_192) {
                updates.avatarUrl = slackUser.profile.image_192;
            }

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
                            data: { slackId: u.slackId, avatarUrl: u.avatarUrl },
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
