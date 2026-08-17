import { UserRepository } from '../users/user.repository.js';
import { AchievementRepository } from '../achievements/achievement.repository.js';
import { NotFoundError, ConflictError } from '@/errors/AppErrors.js';
import { prisma } from '@/shared/prisma.js';

export class AdminService {
    constructor(
        private userRepo: UserRepository,
        private achievementRepo: AchievementRepository,
    ) {}

    // Управление пользователями
    async getAllUsers(page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;
        const users = await prisma.user.findMany({
            skip,
            take: limit,
            include: {
                roles: { include: { role: true } },
            },
        });
        return users;
    }

    async getUserById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                roles: { include: { role: true } },
                specializations: { include: { specialization: true } },
            },
        });
        if (!user) {
            throw new NotFoundError('User not found');
        }
        return user;
    }

    // Управление ролями
    async assignRole(userId: string, roleCode: string) {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        const role = await prisma.role.findUnique({ where: { code: roleCode } });
        if (!role) {
            throw new NotFoundError('Role not found');
        }

        // Проверяем, есть ли уже роль
        const existingUserRole = await prisma.userRole.findUnique({
            where: { userId_roleId: { userId, roleId: role.id } },
        });

        if (existingUserRole) {
            throw new ConflictError('User already has this role');
        }

        await prisma.userRole.create({
            data: { userId, roleId: role.id },
        });
    }

    async removeRole(userId: string, roleCode: string) {
        const role = await prisma.role.findUnique({ where: { code: roleCode } });
        if (!role) {
            throw new NotFoundError('Role not found');
        }

        await prisma.userRole.delete({
            where: { userId_roleId: { userId, roleId: role.id } },
        });
    }

    // Управление специализациями
    async getAllSpecializations() {
        return prisma.specialization.findMany();
    }

    async createSpecialization(data: { code: string; name: string }) {
        const existing = await prisma.specialization.findUnique({
            where: { code: data.code },
        });

        if (existing) {
            throw new ConflictError('Specialization already exists');
        }

        return prisma.specialization.create({ data });
    }

    async deleteSpecialization(id: string) {
        await prisma.specialization.delete({ where: { id } });
    }

    // Управление специализациями пользователей
    async assignSpecialization(userId: string, specializationCode: string) {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        const specialization = await prisma.specialization.findUnique({
            where: { code: specializationCode },
        });
        if (!specialization) {
            throw new NotFoundError('Specialization not found');
        }

        const existing = await prisma.userSpecialization.findUnique({
            where: { userId_specializationId: { userId, specializationId: specialization.id } },
        });

        if (existing) {
            throw new ConflictError('User already has this specialization');
        }

        await prisma.userSpecialization.create({
            data: { userId, specializationId: specialization.id },
        });
    }

    async removeSpecialization(userId: string, specializationCode: string) {
        const specialization = await prisma.specialization.findUnique({
            where: { code: specializationCode },
        });
        if (!specialization) {
            throw new NotFoundError('Specialization not found');
        }

        await prisma.userSpecialization.delete({
            where: { userId_specializationId: { userId, specializationId: specialization.id } },
        });
    }
}
