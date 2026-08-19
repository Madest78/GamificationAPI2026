import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '@/shared/middleware/validate.js';
import { UserRepository } from './user.repository.js';
import { AuthRequest } from '../auth/auth.middleware.js';

const updateProfileSchema = z.object({
    emplannerUid: z.string().regex(/^\d{2}-\d{7}$/).optional(),
    slackId: z.string().optional(),
    avatarUrl: z.string().url().optional(),
});

interface UserRouterDeps {
    userRepo: UserRepository;
    verifyToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireAuth: (req: Request, res: Response, next: NextFunction) => void;
}

export function createUserRouter({ userRepo, verifyToken, requireAuth }: UserRouterDeps): Router {
    const router = Router();

    router.use(verifyToken, requireAuth);

    router.get('/me', async (req: AuthRequest, res: Response) => {
        const user = await userRepo.findById(req.user!.id);
        res.json(user);
    });

    router.patch('/me', validate(updateProfileSchema), async (req: AuthRequest, res: Response) => {
        const user = await userRepo.update(req.user!.id, req.body);
        res.json(user);
    });

    return router;
}
