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

export class EmplannerAdapter {
    private baseUrl: string;
    private token: string;

    constructor() {
        this.baseUrl = env.EMPLANNER_API_URL;
        this.token = env.EMPLANNER_TOKEN;
    }

    async getUserByEmail(email: string): Promise<EmplannerUser | null> {
        const url = `${this.baseUrl}/users?email=${encodeURIComponent(email)}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
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
