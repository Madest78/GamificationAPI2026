import { env } from '@/config/env.js';
import { execSync } from 'child_process';

export interface EmplannerUser {
    id: string;
    firstName: string;
    lastName: string;
    extraId: string;
    email: string;
    corporateEmail?: string; // personal email from API (counterintuitive naming!)
    availability?: string;
    role: string[];
    tags: string[];
    country?: string;
    city?: string;
    gender?: string;
    fired: boolean;
    utc?: number;
    latestTimeTrackingEvent?: string;
    feedbackUrl?: string;
    hasOnlyTestLicenses?: boolean;
    isVcs?: boolean;
    memberTeams?: Array<{
        id: string;
        name: string;
        badgeColor: string;
        description: string;
    }>;
    leaderTeams?: Array<{
        id: string;
        name: string;
        badgeColor: string;
        description: string;
    }>;
    calculatedProductivityAverage?: Record<string, unknown>;
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
        const searchQuery = email.split('@')[0];
        return this.searchUsers(searchQuery, (u) => u.email.toLowerCase() === email.toLowerCase());
    }

    /**
     * Полный дамп всех пользователей.
     * API не даёт глубокую пагинацию (>1 страница всегда возвращает pageIndex:0).
     * Решение: запрашиваем по 300 юзеров с разными sortBy/order комбинациями,
     * дедуплицируем по id. ~18 запросов, ~1400+ уникальных юзеров.
     */
    async getAllUsers(): Promise<EmplannerUser[]> {
        const seen = new Set<string>();
        const all: EmplannerUser[] = [];
        const sorts = ['firstName', 'lastName', 'email', 'country', 'city', 'gender', 'utc', 'availability', 'extraId'];
        const orders: Array<'asc' | 'desc'> = ['asc', 'desc'];
        const token = await this.getSessionToken();

        for (const sortBy of sorts) {
            for (const order of orders) {
                const url = `${this.baseUrl}/rest/v3/user?p.pageSize=300&p.sortBy=${sortBy}&p.order=${order}&p.pageIndex=0&productionAccess=HAVE_ACCESS`;

                try {
                    const stdout = execSync(
                        `curl -s '${url}' -H 'Authorization: Bearer ${token}' -H 'Accept: application/json'`,
                        { encoding: 'utf-8', timeout: 30000, shell: '/bin/bash' },
                    );

                    const data = JSON.parse(stdout) as EmplannerApiResponse;
                    let added = 0;
                    for (const u of data.details.list) {
                        if (!seen.has(u.id)) {
                            seen.add(u.id);
                            all.push(u);
                            added++;
                        }
                    }
                    console.log(`[Emplanner] ${sortBy}/${order}: +${added} new (total: ${all.length})`);
                } catch (error) {
                    console.warn(`[Emplanner] ${sortBy}/${order} failed:`, error);
                }

                await new Promise((r) => setTimeout(r, 200));
            }
        }

        return all;
    }

    private async searchUsers(
        searchQuery: string,
        matcher: (u: EmplannerUser) => boolean,
    ): Promise<EmplannerUser | null> {
        let found: EmplannerUser | null = null;

        await this.paginate(async (page) => {
            const match = page.details.list.find(matcher);
            if (match) {
                found = match;
                return false;
            }
            return page.details.hasNext;
        }, searchQuery);

        return found;
    }

    private async paginate(
        onPage: (page: EmplannerApiResponse) => Promise<boolean>,
        search?: string,
    ): Promise<void> {
        const token = await this.getSessionToken();
        const pageSize = 50;
        let pageIndex = 0;
        let emptyCount = 0;

        while (true) {
            const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
            const url = `${this.baseUrl}/rest/v3/user?p.pageSize=${pageSize}&p.sortBy=firstName&p.order=asc&p.pageIndex=${pageIndex}${searchParam}&productionAccess=HAVE_ACCESS`;

            const stdout = execSync(
                `curl -s '${url}' -H 'Authorization: Bearer ${token}' -H 'Accept: application/json'`,
                { encoding: 'utf-8', timeout: 30000, shell: '/bin/bash' },
            );

            const data = JSON.parse(stdout) as EmplannerApiResponse;

            if (!data.details.list || data.details.list.length === 0) {
                emptyCount++;
                if (emptyCount >= 2) break;
                await new Promise((r) => setTimeout(r, 1000));
                continue;
            }
            emptyCount = 0;

            const hasNext = await onPage(data);
            if (!hasNext) break;
            pageIndex++;
            await new Promise((r) => setTimeout(r, 200));
        }
    }
}
