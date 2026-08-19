import { SlackAdapter } from './adapter.js';
import { UserRepository } from '@/modules/users/user.repository.js';

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

    async syncAllUsers(): Promise<{ synced: number; errors: number }> {
        const slackUsers = await this.slack.getAllUsers();
        let synced = 0;
        let errors = 0;

        for (const slackUser of slackUsers) {
            if (!slackUser.profile.email) continue;

            try {
                const result = await this.syncUserByEmail(slackUser.profile.email);
                if (result.updated) {
                    synced++;
                }
            } catch (error) {
                console.error(`Failed to sync ${slackUser.profile.email}:`, error);
                errors++;
            }
        }

        return { synced, errors };
    }
}
