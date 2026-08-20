import { env } from '@/config/env.js';

export interface EmplannerUser {
    id: string;
    firstName: string;
    lastName: string;
    extraId: string;
    email: string;
    availability: string;
    role: string[];
    tags: string[];
    country: string;
    city: string;
    gender: string;
    fired: boolean;
}

interface EmplannerApiResponse {
    type: string;
    details: {
        list: EmplannerUser[];
    };
}

interface SessionResponse {
    type: string;
    details: {
        token: string;
    };
}

export class EmplannerAdapter {
    private baseUrl: string;
    private username: string;
    private password: string;
    private sessionToken: string | null = null;

    constructor() {
        this.baseUrl = env.EMPLANNER_API_URL;
        this.username = env.EMPLANNER_USERNAME;
        this.password = env.EMPLANNER_PASSWORD;
    }

    private async getSessionToken(): Promise<string> {
        if (this.sessionToken) {
            return this.sessionToken;
        }

        const url = `${this.baseUrl}/rest/v3/user/me/token?type=WEB_SESSION`;
        const authHeader = `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Emplanner auth error: ${response.status}`);
        }

        const data = await response.json() as SessionResponse;
        this.sessionToken = data.details.token;
        return this.sessionToken;
    }

    async getUserByEmail(email: string): Promise<EmplannerUser | null> {
        const sessionToken = await this.getSessionToken();
        const searchEmail = email.replace('@', '.matusevich@emplanner.team');
        const url = `${this.baseUrl}/rest/v3/user?p.pageSize=50&p.sortBy=firstName&p.order=asc&search=${searchEmail}&productionAccess=HAVE_ACCESS`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sessionToken}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Emplanner API error: ${response.status}`);
        }

        const data = await response.json() as EmplannerApiResponse;

        if (data.details.list.length === 0) {
            return null;
        }

        return data.details.list[0];
    }
}
