import { AchievementRepository } from './achievement.repository.js';
import { UserRepository } from '../users/user.repository.js';
import { NotFoundError, BadRequestError } from '@/errors/AppErrors.js';

export class AchievementService {
    constructor(
        private achievementRepo: AchievementRepository,
        private userRepo: UserRepository,
    ) {}

    // Получить все определения достижений
    async getAllDefinitions() {
        return this.achievementRepo.findAllDefs();
    }

    // Получить достижения пользователя
    async getUserAchievements(userId: string) {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        return this.achievementRepo.findUserAchievements(userId);
    }

    // Проверить условия и выдать достижения
    async checkAndGrantAchievements(userId: string, metrics: Record<string, number>) {
        const definitions = await this.achievementRepo.findAllDefs();
        const grantedAchievements = [];

        for (const def of definitions) {
            // Проверяем условия (JSONLogic)
            if (this.evaluateCondition(def.condition, metrics)) {
                // Проверяем, не получено ли уже достижение
                const existing = await this.achievementRepo.findUserAchievement(userId, def.id);

                if (!existing) {
                    // Выдаем достижение
                    const achievement = await this.achievementRepo.grantAchievement(userId, def.id);
                    grantedAchievements.push({ ...achievement, definition: def });
                }
            }
        }

        return grantedAchievements;
    }

    // Оценка JSONLogic conditions
    private evaluateCondition(condition: Record<string, unknown>, metrics: Record<string, number>): boolean {
        const operator = Object.keys(condition)[0];
        const value = condition[operator];

        switch (operator) {
            case '>=':
                return this.evaluateComparison(value as Record<string, unknown>, metrics, '>=');
            case '<=':
                return this.evaluateComparison(value as Record<string, unknown>, metrics, '<=');
            case '>':
                return this.evaluateComparison(value as Record<string, unknown>, metrics, '>');
            case '<':
                return this.evaluateComparison(value as Record<string, unknown>, metrics, '<');
            case '==':
                return this.evaluateComparison(value as Record<string, unknown>, metrics, '==');
            case '!=':
                return this.evaluateComparison(value as Record<string, unknown>, metrics, '!=');
            case 'and':
                return Array.isArray(value) && value.every(v => this.evaluateCondition(v as Record<string, unknown>, metrics));
            case 'or':
                return Array.isArray(value) && value.some(v => this.evaluateCondition(v as Record<string, unknown>, metrics));
            case 'not':
                return !this.evaluateCondition(value as Record<string, unknown>, metrics);
            default:
                console.warn(`[AchievementService] Unsupported JSONLogic operator: ${operator}`);
                return false;
        }
    }

    private evaluateComparison(
        value: Record<string, unknown>,
        metrics: Record<string, number>,
        operator: string,
    ): boolean {
        const field = Object.keys(value)[0];
        const threshold = value[field] as number;
        const metricValue = metrics[field] || 0;

        switch (operator) {
            case '>=':
                return metricValue >= threshold;
            case '<=':
                return metricValue <= threshold;
            case '>':
                return metricValue > threshold;
            case '<':
                return metricValue < threshold;
            case '==':
                return metricValue === threshold;
            case '!=':
                return metricValue !== threshold;
            default:
                return false;
        }
    }
}
