import { z } from 'zod';

const updateUserRoleSchema = z.object({
    userId: z.string(),
    roleCode: z.string(),
});

const createSpecializationSchema = z.object({
    code: z.string(),
    name: z.string(),
});

const updateUserSpecializationSchema = z.object({
    userId: z.string(),
    specializationCode: z.string(),
});

type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>;
type CreateSpecializationDto = z.infer<typeof createSpecializationSchema>;
type UpdateUserSpecializationDto = z.infer<typeof updateUserSpecializationSchema>;

export {
    updateUserRoleSchema,
    createSpecializationSchema,
    updateUserSpecializationSchema,
    UpdateUserRoleDto,
    CreateSpecializationDto,
    UpdateUserSpecializationDto,
};
