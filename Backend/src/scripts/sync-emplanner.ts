import { PrismaUserRepository } from '@/modules/users/user.repository.prisma.js';
import { EmplannerSyncService } from '@/shared/emplanner/sync.js';
import { prisma } from '@/shared/prisma.js';

async function main() {
    console.log('[SyncAll] Starting Emplanner sync...');

    const userRepo = new PrismaUserRepository(prisma);
    const sync = new EmplannerSyncService(userRepo);

    try {
        const result = await sync.syncAllUsers();
        console.log('[SyncAll] Result:', JSON.stringify(result));
    } catch (error) {
        console.error('[SyncAll] Fatal error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
