import { Router, Request, Response, NextFunction } from 'express';
import { TeamsService } from './teams.service.js';

interface TeamRouterDeps {
    teamsService: TeamsService;
    verifyToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireAuth: (req: Request, res: Response, next: NextFunction) => void;
}

export function createTeamRouter({ teamsService, verifyToken, requireAuth }: TeamRouterDeps): Router {
    const router = Router();

    router.use(verifyToken, requireAuth);

    router.get('/', async (_req: Request, res: Response) => {
        const directory = await teamsService.getDirectory();
        res.json(directory);
    });

    return router;
}
