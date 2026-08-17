import {
    CreateAchievementDefDto,
    UpdateAchievementDefDto,
    AchievementDefDto,
    UserAchievementDto,
} from './achievement.interface.js';

export interface AchievementRepository {
    // Achievement definitions
    findAllDefs(): Promise<AchievementDefDto[]>;
    findDefById(id: string): Promise<AchievementDefDto | null>;
    findDefByCode(code: string): Promise<AchievementDefDto | null>;
    createDef(data: CreateAchievementDefDto): Promise<AchievementDefDto>;
    updateDef(id: string, data: UpdateAchievementDefDto): Promise<AchievementDefDto>;
    deleteDef(id: string): Promise<void>;

    // User achievements
    findUserAchievements(userId: string): Promise<UserAchievementDto[]>;
    findUserAchievement(userId: string, achievementDefId: string): Promise<UserAchievementDto | null>;
    grantAchievement(userId: string, achievementDefId: string): Promise<UserAchievementDto>;
    updateProgress(userId: string, achievementDefId: string, progress: number): Promise<UserAchievementDto>;
}
