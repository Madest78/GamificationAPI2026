import { z } from 'zod';

const createAchievementDefSchema = z.object({
    code: z.string(),
    name: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    condition: z.record(z.string(), z.unknown()),
    points: z.number().int().min(0).default(0),
    isRecurring: z.boolean().default(false),
});

const updateAchievementDefSchema = createAchievementDefSchema.partial();

type CreateAchievementDefDto = z.infer<typeof createAchievementDefSchema>;
type UpdateAchievementDefDto = z.infer<typeof updateAchievementDefSchema>;

interface AchievementDefDto {
    id: string;
    code: string;
    name: string;
    description: string | null;
    icon: string | null;
    condition: Record<string, unknown>;
    points: number;
    isRecurring: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface UserAchievementDto {
    id: string;
    userId: string;
    achievementDefId: string;
    earnedAt: Date;
    progress: number;
}

export {
    createAchievementDefSchema,
    updateAchievementDefSchema,
    CreateAchievementDefDto,
    UpdateAchievementDefDto,
    AchievementDefDto,
    UserAchievementDto,
};
