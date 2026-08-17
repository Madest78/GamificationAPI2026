import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { prisma } from '@/shared/prisma.js';

// Zod схема для валидации
const roleSchema = z.object({
    code: z.string(),
    name: z.string(),
    description: z.string(),
});

const rolesArraySchema = z.array(roleSchema);

// Основная функция
async function main() {
    //читаем json
    const raw = readFileSync('prisma/roles.json', 'utf-8');
    const data = JSON.parse(raw);

    //валидируем
    const roles = rolesArraySchema.parse(data);

    //вставляем
    for (const role of roles) {
        try {
            await prisma.role.upsert({
                where: {code: role.code},
                create: role,
                update: {name: role.name, description: role.description},
            });
            console.log(`# ${role.code}`);
        } catch(e){
            console.log(`-- ${role.code}:`, e);
        }
    }
    await prisma.$disconnect();
}

main();