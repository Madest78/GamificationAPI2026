import { UserRepository } from '@/modules/users/user.repository.js';
import { EmplannerAdapter, EmplannerUser } from './adapter.js';
import { mapEmplannerTeamsToRoles } from './mapping.js';
import { prisma } from '@/shared/prisma.js';

export class EmplannerSyncService {
    private adapter: EmplannerAdapter;

    constructor(private userRepo: UserRepository) {
        this.adapter = new EmplannerAdapter();
    }

    async syncUserByEmail(email: string): Promise<void> {
        const emplannerUser = await this.adapter.getUserByEmail(email);

        if (!emplannerUser) {
            throw new Error(`User not found in Emplanner: ${email}`);
        }

        const existingUser = await this.userRepo.findByEmail(email);

        if (!existingUser) {
            throw new Error(`User not found in database: ${email}`);
        }

        // Определяем личную почту (gmail и другие не-corporate)
        const isGmail = emplannerUser.email.toLowerCase().endsWith('@gmail.com');
        const personalEmail = isGmail ? emplannerUser.email : null;

        // Сохраняем Emplanner данные
        await this.userRepo.update(existingUser.id, {
            emplannerUid: emplannerUser.id,
            extraId: emplannerUser.extraId,
            personalEmail: personalEmail,
            emplannerRoles: emplannerUser.role || [],
            emplannerTags: emplannerUser.tags || [],
            emplannerCountry: emplannerUser.country || null,
            emplannerCity: emplannerUser.city || null,
            emplannerGender: emplannerUser.gender || null,
            emplannerFired: emplannerUser.fired || false,
            emplannerUtc: emplannerUser.utc || null,
            emplannerTeams: {
                member: emplannerUser.memberTeams || [],
                leader: emplannerUser.leaderTeams || [],
            },
            emplannerProductivity: emplannerUser.calculatedProductivityAverage || null,
            emplannerFeedbackUrl: emplannerUser.feedbackUrl || null,
            emplannerHasOnlyTestLicenses: emplannerUser.hasOnlyTestLicenses || false,
            emplannerIsVcs: emplannerUser.isVcs || false,
        } as any);

        // Маппим команды → роли и специализации
        const mapping = mapEmplannerTeamsToRoles(
            emplannerUser.memberTeams || [],
            emplannerUser.leaderTeams || [],
        );

        // Назначаем роль (только если нет ADMIN или SUPERADMIN)
        const existingRoles = await prisma.userRole.findMany({
            where: { userId: existingUser.id },
            include: { role: true },
        });
        const existingRoleCodes = existingRoles.map(ur => ur.role.code);

        const manualRoles = ['ADMIN', 'SUPERADMIN', 'PROFILES_ADMIN'];
        const hasManualRole = existingRoleCodes.some(r => manualRoles.includes(r));

        if (!hasManualRole) {
            // Удаляем автоматические роли (DRAFTER, TEAMLEAD, MEMBER)
            const autoRoleCodes = ['DRAFTER', 'TEAMLEAD', 'MEMBER'];
            await prisma.userRole.deleteMany({
                where: {
                    userId: existingUser.id,
                    role: { code: { in: autoRoleCodes } },
                },
            });

            // Назначаем новую роль
            const role = await prisma.role.findUnique({
                where: { code: mapping.role },
            });

            if (role) {
                await prisma.userRole.create({
                    data: {
                        userId: existingUser.id,
                        roleId: role.id,
                    },
                });
            }
        }

        // Назначаем специализации
        // Удаляем старые автоматические специализации
        await prisma.userSpecialization.deleteMany({
            where: { userId: existingUser.id },
        });

        // Назначаем новые
        for (const specCode of mapping.specializations) {
            const spec = await prisma.specialization.findUnique({
                where: { code: specCode },
            });

            if (spec) {
                await prisma.userSpecialization.create({
                    data: {
                        userId: existingUser.id,
                        specializationId: spec.id,
                    },
                });
            }
        }
    }
}
