import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '@/shared/middleware/validate.js';
import { KudosService } from './kudos.service.js';
import { AuthRequest } from '../auth/auth.middleware.js';

const sendKudosSchema = z.object({
    receiverId: z.string(),
    kudosTypeId: z.string(),
    message: z.string().optional(),
});

interface KudosRouterDeps {
    kudosService: KudosService;
    verifyToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireAuth: (req: Request, res: Response, next: NextFunction) => void;
}

export function createKudosRouter({ kudosService, verifyToken, requireAuth }: KudosRouterDeps): Router {
    const router = Router();

    router.get('/types', async (_req: Request, res: Response) => {
        const types = await kudosService.getAllTypes();
        res.json(types);
    });

    router.post('/send', verifyToken, requireAuth, validate(sendKudosSchema), async (req: AuthRequest, res: Response) => {
        const { receiverId, kudosTypeId, message } = req.body;
        const transaction = await kudosService.sendKudos(req.user!.id, receiverId, kudosTypeId, message);
        res.json(transaction);
    });

    router.get('/history', verifyToken, requireAuth, async (req: AuthRequest, res: Response) => {
        const history = await kudosService.getHistory(req.user!.id);
        res.json(history);
    });

    router.get('/balance', verifyToken, requireAuth, async (req: AuthRequest, res: Response) => {
        const balance = await kudosService.getBalance(req.user!.id);
        res.json(balance);
    });

    return router;
}
