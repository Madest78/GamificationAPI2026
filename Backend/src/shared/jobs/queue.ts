import { PgBoss } from 'pg-boss';
import { env } from '@/config/env.js';

let boss: PgBoss | null = null;

export async function getQueue(): Promise<PgBoss> {
    if (!boss) {
        boss = new PgBoss({
            connectionString: env.DATABASE_URL,
        });
        await boss.start();
    }
    return boss;
}

export async function stopQueue(): Promise<void> {
    if (boss) {
        await boss.stop();
        boss = null;
    }
}
