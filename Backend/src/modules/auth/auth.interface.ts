import { z } from 'zod';

// --- Zod-схема ---
const createRefreshTokenSchema = z.object({
    tokenHash: z.string(),
    userId: z.string(),
    expiresAt: z.date(),
});

// --- Типы ---
export type CreateRefreshTokenDto = z.infer<typeof createRefreshTokenSchema>;

// --- DTO для чтения ---
export interface RefreshTokenDto {
    id: string;
    tokenHash: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
}

export { createRefreshTokenSchema };
