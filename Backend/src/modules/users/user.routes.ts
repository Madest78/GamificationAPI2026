import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '@/shared/middleware/validate.js';
import { UserRepository } from './user.repository.js';
import { AuthRequest } from '../auth/auth.middleware.js';
import { SlackSyncService } from '@/shared/slack/sync.js';
import { shouldAttemptSync, recordSyncFailure, recordSyncSuccess } from '@/shared/syncCache.js';

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

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Автосинхронизация из Slack если не хватает полей
        if (!user.slackId || !user.avatarUrl) {
            const email = user.email;
            if (shouldAttemptSync('slack', email)) {
                try {
                    await slackSync.syncUserByEmail(email);
                    recordSyncSuccess('slack', email);
                    user = await userRepo.findById(req.user!.id);
                } catch (error) {
                    console.error('Slack sync failed:', error);
                    recordSyncFailure('slack', email);
                }
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
