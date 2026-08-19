import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '@/shared/middleware/validate.js';
import { UserRepository } from './user.repository.js';
import { AuthRequest } from '../auth/auth.middleware.js';
import { SlackSyncService } from '@/shared/slack/sync.js';
import { shouldAttemptSync, recordSyncFailure, recordSyncSuccess } from '@/shared/slack/syncCache.js';

const updateProfileSchema = z.object({
    emplannerUid: z.string().regex(/^\d{2}-\d{7}$/).nullable().optional(),
    slackId: z.string().nullable().optional(),
    avatarUrl: z.string().url().nullable().optional(),
});

interface UserRouterDeps {
    userRepo: UserRepository;
    verifyToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireAuth: (req: Request, res: Response, next: NextFunction) => void;
}

export function createUserRouter({ userRepo, verifyToken, requireAuth }: UserRouterDeps): Router {
    const router = Router();
    const slackSync = new SlackSyncService(userRepo);

    router.use(verifyToken, requireAuth);

    router.get('/me', async (req: AuthRequest, res: Response) => {
        let user = await userRepo.findById(req.user!.id);

        // Автосинхронизация из Slack если не хватает полей
        if (user && (!user.slackId || !user.avatarUrl) && shouldAttemptSync(user.email)) {
            const email = user.email;
            try {
                await slackSync.syncUserByEmail(email);
                recordSyncSuccess(email);
                user = await userRepo.findById(req.user!.id);
            } catch (error) {
                console.error('Slack sync failed:', error);
                recordSyncFailure(email);
            }
        }

        res.json(user);
    });

    router.post('/reset-slack', async (req: AuthRequest, res: Response) => {
        const user = await userRepo.update(req.user!.id, { slackId: null } as any);
        res.json({ message: 'Slack ID cleared', user });
    });

    router.patch('/me', validate(updateProfileSchema), async (req: AuthRequest, res: Response) => {
        const user = await userRepo.update(req.user!.id, req.body);
        res.json(user);
    });

    return router;
}
