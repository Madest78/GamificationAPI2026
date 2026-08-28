import { getQueue } from './queue.js';
import { prisma } from '@/shared/prisma.js';
import { PrismaUserRepository } from '@/modules/users/user.repository.prisma.js';
import { EmplannerSyncService } from '@/shared/emplanner/sync.js';

async function handleImportDaily(job: any) {
    console.log(`[ImportDaily] Processing job ${job.id}`);

    try {
        const userRepo = new PrismaUserRepository(prisma);
        const emplannerSync = new EmplannerSyncService(userRepo);
        const result = await emplannerSync.syncAllUsers();
        console.log(`[ImportDaily] Emplanner sync: ${result.synced}/${result.total} synced, ${result.skipped} skipped, ${result.failed} failed`);
    } catch (error) {
        console.error('[ImportDaily] Emplanner sync failed:', error);
        throw error;
    }

    // TODO: Импорт данных из BigQuery (DS Shop, Google Sheets)
}

async function handleAchievementsCheck(job: any) {
    console.log(`[AchievementsCheck] Processing job ${job.id}`);
    // TODO: Реализовать проверку достижений
    // 1. Получить определения достижений
    // 2. Проверить условия для каждого пользователя
    // 3. Выдать достижения
    console.log('[AchievementsCheck] Job completed');
}

async function handleKudosReset(job: any) {
    console.log(`[KudosReset] Processing job ${job.id}`);
    // TODO: Реализовать сброс kudos
    // 1. Сбросить баланс kudos для всех пользователей
    // 2. Обновить случайный пул
    console.log('[KudosReset] Job completed');
}

export async function startWorkers(): Promise<void> {
    const boss = await getQueue();

    // Регистрируем обработчики
    await boss.work('import-daily', handleImportDaily);
    await boss.work('achievements-check', handleAchievementsCheck);
    await boss.work('kudos-reset', handleKudosReset);

    console.log('[Workers] All workers started');
}

export async function stopWorkers(): Promise<void> {
    const boss = await getQueue();
    await boss.stop();
    console.log('[Workers] All workers stopped');
}
