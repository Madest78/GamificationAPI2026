import { EmplannerAdapter } from '@/shared/emplanner/adapter.js';
import { prisma } from '@/shared/prisma.js';

async function main() {
    const adapter = new EmplannerAdapter();

    // Test single user fetch
    console.log('[Test] Fetching single user...');
    const u = await adapter.getUserByEmail('yury.matusevich@emplanner.team');
    console.log('[Test] Found:', !!u, u?.email, 'teams:', u?.memberTeams?.length, u?.leaderTeams?.length);

    // Test full dump
    console.log('[Test] Fetching ALL users from Emplanner (1464 expected)...');
    const start = Date.now();
    const all = await adapter.getAllUsers();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[Test] Got ${all.length} users in ${elapsed}s`);

    // DB stats
    const dbCount = await prisma.user.count();
    console.log(`[Test] DB: ${dbCount} users`);

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
