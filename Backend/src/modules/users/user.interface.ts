import { z } from 'zod';

export const createUserSchema = z.object({
    email: z.string().email(),
    name: z.string().optional(),
    avatarUrl: z.string().optional(),
    googleId: z.string().optional(),
    emplannerUid: z.string().regex(/^\d{2}-\d{7}$/).optional(),
    slackId: z.string().optional(),
})

export const updateUserSchema = createUserSchema.partial();

export type CreateUserDto = z.infer<typeof createUserSchema>
export type UpdateUserDto = z.infer<typeof updateUserSchema>

export interface UserDto {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    emplannerUid: string | null;
    slackId: string | null;
    createdAt: Date;
    updatedAt: Date;
}