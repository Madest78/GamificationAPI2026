import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '@/shared/middleware/validate.js';
import { AuthService } from './auth.service.js';
import { AuthRequest } from './auth.middleware.js';
import { env } from '@/config/env.js';
import { BadRequestError } from '@/errors/AppErrors.js';

const refreshSchema = z.object({
    refreshToken: z.string(),
});

interface AuthRouterDeps {
    authService: AuthService;
    verifyToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireAuth: (req: Request, res: Response, next: NextFunction) => void;
}

export function createAuthRouter({ authService, verifyToken, requireAuth }: AuthRouterDeps): Router {
    const router = Router();

    router.get('/google', (_req: Request, res: Response) => {
        const params = new URLSearchParams({
            client_id: env.GOOGLE_CLIENT_ID,
            redirect_uri: env.GOOGLE_CALLBACK_URL,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            prompt: 'consent',
        });

        res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
    });

    router.get('/google/callback', async (req: Request, res: Response) => {
        const code = req.query.code as string;

        if (!code) {
            throw new BadRequestError('No code provided');
        }

        const { accessToken, refreshToken } = await authService.handleGoogleCallback(code);

        const origin = req.protocol + '://' + req.get('host');
        const redirectUrl = new URL('/auth/callback', origin);
        redirectUrl.searchParams.set('accessToken', accessToken);
        redirectUrl.searchParams.set('refreshToken', refreshToken);

        res.redirect(redirectUrl.toString());
    });

    router.post('/refresh', validate(refreshSchema), async (req: Request, res: Response) => {
        const { refreshToken } = req.body;
        const tokens = await authService.refreshTokens(refreshToken);
        res.json(tokens);
    });

    router.post('/logout', verifyToken, requireAuth, async (req: AuthRequest, res: Response) => {
        const jti = (req as any).payload?.jti;
        await authService.logout(req.user!.id, jti);
        res.json({ message: 'Logged out' });
    });

    router.get('/me', verifyToken, requireAuth, async (req: AuthRequest, res: Response) => {
        const user = await authService.getCurrentUser(req.user!.id);
        res.json(user);
    });

    return router;
}
