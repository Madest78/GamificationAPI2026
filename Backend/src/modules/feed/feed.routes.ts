import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '@/shared/middleware/validate.js';
import { FeedService } from './feed.service.js';
import { AuthRequest } from '../auth/auth.middleware.js';

const followSchema = z.object({
    followingId: z.string(),
});

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

interface FeedRouterDeps {
    feedService: FeedService;
    verifyToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireAuth: (req: Request, res: Response, next: NextFunction) => void;
}

export function createFeedRouter({ feedService, verifyToken, requireAuth }: FeedRouterDeps): Router {
    const router = Router();

    router.post('/follow', verifyToken, requireAuth, validate(followSchema), async (req: AuthRequest, res: Response) => {
        const { followingId } = req.body;
        await feedService.follow(req.user!.id, followingId as string);
        res.json({ message: 'Followed' });
    });

    router.delete('/follow/:followingId', verifyToken, requireAuth, async (req: AuthRequest, res: Response) => {
        const { followingId } = req.params as { followingId: string };
        await feedService.unfollow(req.user!.id, followingId);
        res.json({ message: 'Unfollowed' });
    });

    router.get('/', verifyToken, requireAuth, validate(paginationSchema, 'query'), async (req: AuthRequest, res: Response) => {
        const { page, limit } = req.query as unknown as { page: number; limit: number };
        const feed = await feedService.getFeed(req.user!.id, page, limit);
        res.json(feed);
    });

    router.get('/following', verifyToken, requireAuth, async (req: AuthRequest, res: Response) => {
        const following = await feedService.getFollowing(req.user!.id);
        res.json(following);
    });

    router.get('/followers', verifyToken, requireAuth, async (req: AuthRequest, res: Response) => {
        const followers = await feedService.getFollowers(req.user!.id);
        res.json(followers);
    });

    return router;
}
