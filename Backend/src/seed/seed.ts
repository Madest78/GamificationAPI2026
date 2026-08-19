import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { prisma } from '@/shared/prisma.js';

// --- Schemas ---

const roleSchema = z.object({
    code: z.string(),
    name: z.string(),
    description: z.string(),
});

const specializationSchema = z.object({
    code: z.string(),
    name: z.string(),
});

const kudosTypeSchema = z.object({
    code: z.string(),
    name: z.string(),
    emoji: z.string(),
    description: z.string().optional(),
});

const achievementDefSchema = z.object({
    code: z.string(),
    name: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    condition: z.record(z.string(), z.any()),
    points: z.number().int().min(0),
    isRecurring: z.boolean(),
});

// --- Main ---

async function main() {
    console.log('🌱 Seeding database...\n');

    // 1. Roles
    console.log('📋 Roles:');
    const roles = z.array(roleSchema).parse(JSON.parse(readFileSync('prisma/roles.json', 'utf-8')));
    for (const role of roles) {
        try {
            await prisma.role.upsert({
                where: { code: role.code },
                create: role,
                update: { name: role.name, description: role.description },
            });
            console.log(`  ✅ ${role.code}`);
        } catch (e) {
            console.log(`  ❌ ${role.code}:`, e);
        }
    }

    // 2. Specializations
    console.log('\n🎯 Specializations:');
    const specializations = z.array(specializationSchema).parse(JSON.parse(readFileSync('prisma/specializations.json', 'utf-8')));
    for (const spec of specializations) {
        try {
            await prisma.specialization.upsert({
                where: { code: spec.code },
                create: spec,
                update: { name: spec.name },
            });
            console.log(`  ✅ ${spec.code}`);
        } catch (e) {
            console.log(`  ❌ ${spec.code}:`, e);
        }
    }

    // 3. Kudos Types
    console.log('\n🎁 Kudos Types:');
    const kudosTypes = z.array(kudosTypeSchema).parse(JSON.parse(readFileSync('prisma/kudos-types.json', 'utf-8')));
    for (const type of kudosTypes) {
        try {
            await prisma.kudosType.upsert({
                where: { code: type.code },
                create: type,
                update: { name: type.name, emoji: type.emoji, description: type.description },
            });
            console.log(`  ✅ ${type.emoji} ${type.code}`);
        } catch (e) {
            console.log(`  ❌ ${type.code}:`, e);
        }
    }

    // 4. Achievement Definitions
    console.log('\n🏆 Achievements:');
    const achievements = z.array(achievementDefSchema).parse(JSON.parse(readFileSync('prisma/achievements.json', 'utf-8')));
    for (const ach of achievements) {
        try {
            await prisma.achievementDef.upsert({
                where: { code: ach.code },
                create: ach as any,
                update: {
                    name: ach.name,
                    description: ach.description,
                    icon: ach.icon,
                    condition: ach.condition as any,
                    points: ach.points,
                    isRecurring: ach.isRecurring,
                },
            });
            console.log(`  ✅ ${ach.icon || '🏅'} ${ach.code}`);
        } catch (e) {
            console.log(`  ❌ ${ach.code}:`, e);
        }
    }

    console.log('\n✨ Seeding complete!');
    await prisma.$disconnect();
}

main();
