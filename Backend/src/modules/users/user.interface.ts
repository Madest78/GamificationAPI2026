import { z } from 'zod';

export const createUserSchema = z.object({
    email: z.string().email(),
    name: z.string().optional(),
    avatarUrl: z.string().optional(),
    googleId: z.string().optional(),
    emplannerUid: z.string().optional(),
    extraId: z.string().regex(/^\d{2}-\d{7}$/).optional(),
    slackId: z.string().optional(),
    personalEmail: z.string().email().optional(),
    emplannerRoles: z.array(z.string()).optional(),
    emplannerTags: z.array(z.string()).optional(),
    emplannerCountry: z.string().optional(),
    emplannerCity: z.string().optional(),
    emplannerGender: z.string().optional(),
    emplannerFired: z.boolean().optional(),
    emplannerUtc: z.number().optional(),
    emplannerTeams: z.record(z.string(), z.unknown()).optional(),
    emplannerProductivity: z.record(z.string(), z.unknown()).optional(),
    emplannerFeedbackUrl: z.string().optional(),
    emplannerHasOnlyTestLicenses: z.boolean().optional(),
    emplannerIsVcs: z.boolean().optional(),
})

export const updateUserSchema = createUserSchema.partial();

export type CreateUserDto = z.infer<typeof createUserSchema>
export type UpdateUserDto = z.infer<typeof updateUserSchema>

export interface UserDto {
    id: string;
    email: string;
    personalEmail: string | null;
    name: string | null;
    avatarUrl: string | null;
    emplannerUid: string | null;
    extraId: string | null;
    slackId: string | null;
    emplannerRoles: string[] | null;
    emplannerTags: string[] | null;
    emplannerCountry: string | null;
    emplannerCity: string | null;
    emplannerGender: string | null;
    emplannerFired: boolean | null;
    emplannerUtc: number | null;
    emplannerTeams: Record<string, unknown> | null;
    emplannerProductivity: Record<string, unknown> | null;
    emplannerFeedbackUrl: string | null;
    emplannerHasOnlyTestLicenses: boolean | null;
    emplannerIsVcs: boolean | null;
    createdAt: Date;
    updatedAt: Date;
}
