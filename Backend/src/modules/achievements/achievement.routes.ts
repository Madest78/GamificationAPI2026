import { Router, Request, Response, NextFunction } from 'express';
import { AchievementService } from './achievement.service.js';
import { AuthRequest } from '../auth/auth.middleware.js';

interface AchievementRouterDeps {
    achievementService: AchievementService;
    verifyToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireAuth: (req: Request, res: Response, next: NextFunction) => void;
    requireRole: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
}

export function createAchievementRouter({ achievementService, verifyToken, requireAuth, requireRole }: AchievementRouterDeps): Router {
    const router = Router();

    router.get('/', async (_req: Request, res: Response) => {
        const definitions = await achievementService.getAllDefinitions();
        res.json(definitions);
    });

    router.get('/user/:userId', verifyToken, requireAuth, async (req: AuthRequest, res: Response) => {
        const { userId } = req.params as { userId: string };
        const achievements = await achievementService.getUserAchievements(userId);
        res.json(achievements);
    });

    router.post('/check', verifyToken, requireAuth, requireRole('ADMIN', 'SUPERADMIN'), async (req: AuthRequest, res: Response) => {
        const { userId, metrics } = req.body;
        const granted = await achievementService.checkAndGrantAchievements(userId as string, metrics as Record<string, number>);
        res.json({ granted });
    });

    return router;
}
