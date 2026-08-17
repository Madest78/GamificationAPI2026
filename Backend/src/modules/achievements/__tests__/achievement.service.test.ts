import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AchievementService } from '../achievement.service.js';
import { AchievementRepository } from '../achievement.repository.js';
import { UserRepository } from '../../users/user.repository.js';

describe('AchievementService', () => {
    let achievementService: AchievementService;
    let achievementRepo: ReturnType<typeof createMockAchievementRepo>;
    let userRepo: ReturnType<typeof createMockUserRepo>;

    beforeEach(() => {
        vi.clearAllMocks();
        achievementRepo = createMockAchievementRepo();
        userRepo = createMockUserRepo();
        achievementService = new AchievementService(achievementRepo, userRepo);
    });

    describe('checkAndGrantAchievements', () => {
        it('should grant achievement when condition met', async () => {
            const defs = [{
                id: 'def-1',
                code: 'FIRST_ORDER',
                name: 'First Order',
                description: 'Complete first order',
                icon: null,
                condition: { '>=': { ordersCompleted: 1 } },
                points: 10,
                isRecurring: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            }];

            achievementRepo.findAllDefs.mockResolvedValue(defs);
            achievementRepo.findUserAchievement.mockResolvedValue(null);
            achievementRepo.grantAchievement.mockResolvedValue({
                id: 'ua-1',
                userId: 'user-1',
                achievementDefId: 'def-1',
                earnedAt: new Date(),
                progress: 1,
            });

            const result = await achievementService.checkAndGrantAchievements(
                'user-1',
                { ordersCompleted: 3 }
            );

            expect(result).toHaveLength(1);
            expect(result[0].definition.code).toBe('FIRST_ORDER');
        });

        it('should not grant if already earned', async () => {
            const defs = [{
                id: 'def-1',
                code: 'FIRST_ORDER',
                name: 'First Order',
                description: null,
                icon: null,
                condition: { '>=': { ordersCompleted: 1 } },
                points: 10,
                isRecurring: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            }];

            achievementRepo.findAllDefs.mockResolvedValue(defs);
            achievementRepo.findUserAchievement.mockResolvedValue({
                id: 'ua-1',
                userId: 'user-1',
                achievementDefId: 'def-1',
                earnedAt: new Date(),
                progress: 1,
            });

            const result = await achievementService.checkAndGrantAchievements(
                'user-1',
                { ordersCompleted: 3 }
            );

            expect(result).toHaveLength(0);
        });

        it('should not grant if condition not met', async () => {
            const defs = [{
                id: 'def-1',
                code: 'FIRST_ORDER',
                name: 'First Order',
                description: null,
                icon: null,
                condition: { '>=': { ordersCompleted: 5 } },
                points: 10,
                isRecurring: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            }];

            achievementRepo.findAllDefs.mockResolvedValue(defs);

            const result = await achievementService.checkAndGrantAchievements(
                'user-1',
                { ordersCompleted: 3 }
            );

            expect(result).toHaveLength(0);
        });
    });

    describe('evaluateCondition', () => {
        const defs = (condition: Record<string, unknown>) => [{
            id: 'def-1',
            code: 'TEST',
            name: 'Test',
            description: null,
            icon: null,
            condition,
            points: 10,
            isRecurring: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        }];

        it('should evaluate >= correctly', async () => {
            achievementRepo.findAllDefs.mockResolvedValue(defs({ '>=': { score: 10 } }));
            achievementRepo.findUserAchievement.mockResolvedValue(null);
            achievementRepo.grantAchievement.mockResolvedValue({
                id: 'ua-1', userId: 'u1', achievementDefId: 'def-1', earnedAt: new Date(), progress: 1,
            });

            const result = await achievementService.checkAndGrantAchievements('u1', { score: 15 });
            expect(result).toHaveLength(1);

            achievementRepo.grantAchievement.mockClear();
            achievementRepo.findAllDefs.mockResolvedValue(defs({ '>=': { score: 10 } }));
            const result2 = await achievementService.checkAndGrantAchievements('u1', { score: 5 });
            expect(result2).toHaveLength(0);
        });

        it('should evaluate > correctly', async () => {
            achievementRepo.findAllDefs.mockResolvedValue(defs({ '>': { score: 10 } }));
            achievementRepo.findUserAchievement.mockResolvedValue(null);
            achievementRepo.grantAchievement.mockResolvedValue({
                id: 'ua-1', userId: 'u1', achievementDefId: 'def-1', earnedAt: new Date(), progress: 1,
            });

            const result = await achievementService.checkAndGrantAchievements('u1', { score: 11 });
            expect(result).toHaveLength(1);
        });

        it('should evaluate < correctly', async () => {
            achievementRepo.findAllDefs.mockResolvedValue(defs({ '<': { errors: 3 } }));
            achievementRepo.findUserAchievement.mockResolvedValue(null);
            achievementRepo.grantAchievement.mockResolvedValue({
                id: 'ua-1', userId: 'u1', achievementDefId: 'def-1', earnedAt: new Date(), progress: 1,
            });

            const result = await achievementService.checkAndGrantAchievements('u1', { errors: 1 });
            expect(result).toHaveLength(1);
        });

        it('should evaluate != correctly', async () => {
            achievementRepo.findAllDefs.mockResolvedValue(defs({ '!=': { status: 0 } }));
            achievementRepo.findUserAchievement.mockResolvedValue(null);
            achievementRepo.grantAchievement.mockResolvedValue({
                id: 'ua-1', userId: 'u1', achievementDefId: 'def-1', earnedAt: new Date(), progress: 1,
            });

            const result = await achievementService.checkAndGrantAchievements('u1', { status: 1 });
            expect(result).toHaveLength(1);
        });

        it('should evaluate and correctly', async () => {
            achievementRepo.findAllDefs.mockResolvedValue(defs({
                and: [{ '>=': { a: 1 } }, { '>=': { b: 2 } }],
            }));
            achievementRepo.findUserAchievement.mockResolvedValue(null);
            achievementRepo.grantAchievement.mockResolvedValue({
                id: 'ua-1', userId: 'u1', achievementDefId: 'def-1', earnedAt: new Date(), progress: 1,
            });

            const result = await achievementService.checkAndGrantAchievements('u1', { a: 1, b: 3 });
            expect(result).toHaveLength(1);
        });

        it('should evaluate or correctly', async () => {
            achievementRepo.findAllDefs.mockResolvedValue(defs({
                or: [{ '>=': { a: 10 } }, { '>=': { b: 10 } }],
            }));
            achievementRepo.findUserAchievement.mockResolvedValue(null);
            achievementRepo.grantAchievement.mockResolvedValue({
                id: 'ua-1', userId: 'u1', achievementDefId: 'def-1', earnedAt: new Date(), progress: 1,
            });

            const result = await achievementService.checkAndGrantAchievements('u1', { a: 5, b: 15 });
            expect(result).toHaveLength(1);
        });

        it('should evaluate not correctly', async () => {
            achievementRepo.findAllDefs.mockResolvedValue(defs({
                not: { '>=': { banned: 1 } },
            }));
            achievementRepo.findUserAchievement.mockResolvedValue(null);
            achievementRepo.grantAchievement.mockResolvedValue({
                id: 'ua-1', userId: 'u1', achievementDefId: 'def-1', earnedAt: new Date(), progress: 1,
            });

            const result = await achievementService.checkAndGrantAchievements('u1', { banned: 0 });
            expect(result).toHaveLength(1);
        });
    });
});

function createMockAchievementRepo(): AchievementRepository {
    return {
        findAllDefs: vi.fn(),
        findDefById: vi.fn(),
        findDefByCode: vi.fn(),
        createDef: vi.fn(),
        updateDef: vi.fn(),
        deleteDef: vi.fn(),
        findUserAchievements: vi.fn(),
        findUserAchievement: vi.fn(),
        grantAchievement: vi.fn(),
        updateProgress: vi.fn(),
    };
}

function createMockUserRepo(): UserRepository {
    return {
        findById: vi.fn(),
        findByEmail: vi.fn(),
        findByGoogleId: vi.fn(),
        findByEmplannerUid: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findRolesByUserId: vi.fn(),
        findUserWithRoles: vi.fn(),
    };
}
