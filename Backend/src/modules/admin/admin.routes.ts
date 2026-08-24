import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '@/shared/middleware/validate.js';
import { AdminService } from './admin.service.js';
import { AuthRequest } from '../auth/auth.middleware.js';
import { readFileSync } from 'node:fs';

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

const roleSchema = z.object({
    roleCode: z.string(),
});

const specializationSchema = z.object({
    code: z.string(),
    name: z.string(),
});

const userSpecializationSchema = z.object({
    specializationCode: z.string(),
});

interface AdminRouterDeps {
    adminService: AdminService;
    verifyToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireAuth: (req: Request, res: Response, next: NextFunction) => void;
    requireRole: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
}

export function createAdminRouter({ adminService, verifyToken, requireAuth, requireRole }: AdminRouterDeps): Router {
    const router = Router();

    router.use(verifyToken, requireAuth, requireRole('ADMIN', 'SUPERADMIN'));

    router.get('/users', validate(paginationSchema, 'query'), async (req: AuthRequest, res: Response) => {
        const { page, limit } = req.query as unknown as { page: number; limit: number };
        const users = await adminService.getAllUsers(page, limit);
        res.json(users);
    });

    router.get('/users/:id', async (req: AuthRequest, res: Response) => {
        const { id } = req.params as { id: string };
        const user = await adminService.getUserById(id);
        res.json(user);
    });

    router.post('/users/:id/roles', validate(roleSchema), async (req: AuthRequest, res: Response) => {
        const { id } = req.params as { id: string };
        const { roleCode } = req.body;
        await adminService.assignRole(id, roleCode);
        res.json({ message: 'Role assigned' });
    });

    router.delete('/users/:id/roles/:roleCode', async (req: AuthRequest, res: Response) => {
        const { id, roleCode } = req.params as { id: string; roleCode: string };
        await adminService.removeRole(id, roleCode);
        res.json({ message: 'Role removed' });
    });

    router.get('/specializations', async (_req: Request, res: Response) => {
        const specializations = await adminService.getAllSpecializations();
        res.json(specializations);
    });

    router.post('/specializations', validate(specializationSchema), async (req: AuthRequest, res: Response) => {
        const specialization = await adminService.createSpecialization(req.body);
        res.json(specialization);
    });

    router.delete('/specializations/:id', async (req: AuthRequest, res: Response) => {
        const { id } = req.params as { id: string };
        await adminService.deleteSpecialization(id);
        res.json({ message: 'Specialization deleted' });
    });

    router.post('/users/:id/specializations', validate(userSpecializationSchema), async (req: AuthRequest, res: Response) => {
        const { id } = req.params as { id: string };
        const { specializationCode } = req.body;
        await adminService.assignSpecialization(id, specializationCode);
        res.json({ message: 'Specialization assigned' });
    });

    router.delete('/users/:id/specializations/:specializationCode', async (req: AuthRequest, res: Response) => {
        const { id, specializationCode } = req.params as { id: string; specializationCode: string };
        await adminService.removeSpecialization(id, specializationCode);
        res.json({ message: 'Specialization removed' });
    });

    router.post('/seed', requireRole('SUPERADMIN'), async (_req: AuthRequest, res: Response) => {
        try {
            const { prisma } = await import('@/shared/prisma.js');

            const roles = JSON.parse(readFileSync('prisma/roles.json', 'utf-8'));
            for (const role of roles) {
                await prisma.role.upsert({
                    where: { code: role.code },
                    create: role,
                    update: { name: role.name, description: role.description },
                });
            }

            const specializations = JSON.parse(readFileSync('prisma/specializations.json', 'utf-8'));
            for (const spec of specializations) {
                await prisma.specialization.upsert({
                    where: { code: spec.code },
                    create: spec,
                    update: { name: spec.name },
                });
            }

            res.json({ message: 'Seed completed', roles: roles.length, specializations: specializations.length });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}
