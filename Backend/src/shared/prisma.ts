import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';


declare global {
    var prisma: PrismaClient | undefined;
}

if (!globalThis.prisma) {
    const adapter = new PrismaPg(process.env.DATABASE_URL!);
    globalThis.prisma = new PrismaClient({ adapter });
}

export const prisma = globalThis.prisma;

process.on('beforeExit', async () => {
    await prisma.$disconnect();
})