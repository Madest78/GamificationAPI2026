import { prisma } from '@/shared/prisma.js';

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error('Usage: npx tsx scripts/assign-superadmin.ts <email>');
        process.exit(1);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.error(`User not found: ${email}`);
        process.exit(1);
    }

    const role = await prisma.role.findUnique({ where: { code: 'SUPERADMIN' } });
    if (!role) {
        console.error('SUPERADMIN role not found. Run seed first.');
        process.exit(1);
    }

    const existing = await prisma.userRole.findUnique({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
    });

    if (existing) {
        console.log(`${email} is already SUPERADMIN`);
    } else {
        await prisma.userRole.create({
            data: { userId: user.id, roleId: role.id },
        });
        console.log(`${email} is now SUPERADMIN`);
    }

    await prisma.$disconnect();
}

main();
