import { env } from '@/config/env.js';

export interface SlackUser {
    id: string;
    name: string;
    real_name?: string;
    profile: {
        email?: string;
        image_192?: string;
        image_72?: string;
    };
}

export interface SlackUsersResponse {
    ok: boolean;
    members?: SlackUser[];
    error?: string;
}

export class SlackAdapter {
    private token: string;
    private baseUrl = 'https://slack.com/api';

    constructor() {
        this.token = env.SLACK_BOT_TOKEN;
    }

    async getAllUsers(): Promise<SlackUser[]> {
        const users: SlackUser[] = [];
        let cursor: string | undefined;

        do {
            const params = new URLSearchParams({
                limit: '200',
                ...(cursor ? { cursor } : {}),
            });

            const response = await fetch(`${this.baseUrl}/users.list?${params}`, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json() as SlackUsersResponse;

            if (!data.ok) {
                throw new Error(`Slack API error: ${data.error}`);
            }

            if (data.members) {
                users.push(...data.members);
            }

            cursor = data.members?.length === 200 ? (data as any).response_metadata?.next_cursor : undefined;
        } while (cursor);

        return users;
    }

    async getUserByEmail(email: string): Promise<SlackUser | null> {
        const response = await fetch(`${this.baseUrl}/users.lookupByEmail?email=${encodeURIComponent(email)}`, {
            headers: {
                Authorization: `Bearer ${this.token}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json() as { ok: boolean; user?: SlackUser; error?: string };

        if (!data.ok) {
            if (data.error === 'users_not_found') {
                return null;
            }
            throw new Error(`Slack API error: ${data.error}`);
        }

        return data.user || null;
    }
}
