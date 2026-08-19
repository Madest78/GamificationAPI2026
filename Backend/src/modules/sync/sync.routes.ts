import { Router, Request, Response, NextFunction } from 'express';
import { SlackSyncService } from '@/shared/slack/sync.js';
import { UserRepository } from '@/modules/users/user.repository.js';
import { AuthRequest } from '../auth/auth.middleware.js';

interface SyncRouterDeps {
    userRepo: UserRepository;
    verifyToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireAuth: (req: Request, res: Response, next: NextFunction) => void;
    requireRole: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
}

export function createSyncRouter({ userRepo, verifyToken, requireAuth, requireRole }: SyncRouterDeps): Router {
    const router = Router();
    const slackSync = new SlackSyncService(userRepo);

    router.use(verifyToken, requireAuth, requireRole('ADMIN', 'SUPERADMIN'));

    router.post('/slack/sync-all', async (_req: AuthRequest, res: Response) => {
        const result = await slackSync.syncAllUsers();
        res.json({ message: 'Sync complete', ...result });
    });

    router.post('/slack/sync', async (req: AuthRequest, res: Response) => {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }
        const result = await slackSync.syncUserByEmail(email);
        res.json(result);
    });

    return router;
}
