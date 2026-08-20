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
        pageIndex: number;
        rowCount: number;
        pageSize: number;
        hasNext: boolean;
        list: EmplannerUser[];
    };
}

interface SessionResponse {
    type: string;
    details: {
        encodedToken: string;
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
        this.sessionToken = data.details.encodedToken;
        return this.sessionToken;
    }

    async getUserByEmail(email: string): Promise<EmplannerUser | null> {
        const token = await this.getSessionToken();

        // Ищем по email через search (с точкой перед доменом для точного поиска)
        const searchQuery = email.replace('@', '.@');
        let pageIndex = 0;
        const pageSize = 50;

        while (true) {
            const url = `${this.baseUrl}/rest/v3/user?p.pageSize=${pageSize}&p.sortBy=firstName&p.order=asc&p.pageIndex=${pageIndex}&search=${encodeURIComponent(searchQuery)}&productionAccess=HAVE_ACCESS`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Emplanner API error: ${response.status}`);
            }

            const data = await response.json() as EmplannerApiResponse;

            // Ищем точное совпадение по email
            const found = data.details.list.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (found) {
                return found;
            }

            // Если есть следующая страница — продолжаем
            if (!data.details.hasNext) {
                break;
            }
            pageIndex++;
        }

        return null;
    }
}
