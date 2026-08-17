import { PrismaClient } from '@/generated/prisma/client.js';
import { AchievementRepository } from './achievement.repository.js';
import {
    CreateAchievementDefDto,
    UpdateAchievementDefDto,
    AchievementDefDto,
    UserAchievementDto,
} from './achievement.interface.js';

export class PrismaAchievementRepository implements AchievementRepository {
    constructor(private prisma: PrismaClient) {}

    private toDefDto(def: any): AchievementDefDto {
        return {
            id: def.id,
            code: def.code,
            name: def.name,
            description: def.description,
            icon: def.icon,
            condition: def.condition as Record<string, unknown>,
            points: def.points,
            isRecurring: def.isRecurring,
            createdAt: def.createdAt,
            updatedAt: def.updatedAt,
        };
    }

    private toUserAchievementDto(ua: any): UserAchievementDto {
        return {
            id: ua.id,
            userId: ua.userId,
            achievementDefId: ua.achievementDefId,
            earnedAt: ua.earnedAt,
            progress: ua.progress,
        };
    }

    // Achievement definitions
    async findAllDefs(): Promise<AchievementDefDto[]> {
        const defs = await this.prisma.achievementDef.findMany();
        return defs.map(this.toDefDto);
    }

    async findDefById(id: string): Promise<AchievementDefDto | null> {
        const def = await this.prisma.achievementDef.findUnique({ where: { id } });
        if (!def) return null;
        return this.toDefDto(def);
    }

    async findDefByCode(code: string): Promise<AchievementDefDto | null> {
        const def = await this.prisma.achievementDef.findUnique({ where: { code } });
        if (!def) return null;
        return this.toDefDto(def);
    }

    async createDef(data: CreateAchievementDefDto): Promise<AchievementDefDto> {
        const def = await this.prisma.achievementDef.create({
            data: {
                ...data,
                condition: data.condition as any,
            },
        });
        return this.toDefDto(def);
    }

    async updateDef(id: string, data: UpdateAchievementDefDto): Promise<AchievementDefDto> {
        const def = await this.prisma.achievementDef.update({
            where: { id },
            data: {
                ...data,
                condition: data.condition as any,
            },
        });
        return this.toDefDto(def);
    }

    async deleteDef(id: string): Promise<void> {
        await this.prisma.achievementDef.delete({ where: { id } });
    }

    // User achievements
    async findUserAchievements(userId: string): Promise<UserAchievementDto[]> {
        const uas = await this.prisma.userAchievement.findMany({
            where: { userId },
        });
        return uas.map(this.toUserAchievementDto);
    }

    async findUserAchievement(userId: string, achievementDefId: string): Promise<UserAchievementDto | null> {
        const ua = await this.prisma.userAchievement.findUnique({
            where: { userId_achievementDefId: { userId, achievementDefId } },
        });
        if (!ua) return null;
        return this.toUserAchievementDto(ua);
    }

    async grantAchievement(userId: string, achievementDefId: string): Promise<UserAchievementDto> {
        const ua = await this.prisma.userAchievement.create({
            data: { userId, achievementDefId },
        });
        return this.toUserAchievementDto(ua);
    }

    async updateProgress(userId: string, achievementDefId: string, progress: number): Promise<UserAchievementDto> {
        const ua = await this.prisma.userAchievement.upsert({
            where: { userId_achievementDefId: { userId, achievementDefId } },
            create: { userId, achievementDefId, progress },
            update: { progress },
        });
        return this.toUserAchievementDto(ua);
    }
}
