import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '@/shared/middleware/validate.js';
import { UserRepository } from './user.repository.js';
import { AuthRequest } from '../auth/auth.middleware.js';
import { SlackSyncService } from '@/shared/slack/sync.js';
import { EmplannerSyncService } from '@/shared/emplanner/sync.js';
import { shouldAttemptSync, recordSyncFailure, recordSyncSuccess } from '@/shared/syncCache.js';

const updateProfileSchema = z.object({
    emplannerUid: z.string().nullable().optional(),
    extraId: z.string().regex(/^\d{2}-\d{7}$/).nullable().optional(),
    slackId: z.string().nullable().optional(),
    avatarUrl: z.string().url().nullable().optional(),
    personalEmail: z.string().email().nullable().optional(),
    emplannerRoles: z.array(z.string()).nullable().optional(),
    emplannerTags: z.array(z.string()).nullable().optional(),
    emplannerCountry: z.string().nullable().optional(),
    emplannerCity: z.string().nullable().optional(),
    emplannerGender: z.string().nullable().optional(),
    emplannerFired: z.boolean().nullable().optional(),
    emplannerUtc: z.number().nullable().optional(),
    emplannerTeams: z.record(z.string(), z.unknown()).nullable().optional(),
    emplannerProductivity: z.record(z.string(), z.unknown()).nullable().optional(),
    emplannerFeedbackUrl: z.string().nullable().optional(),
    emplannerHasOnlyTestLicenses: z.boolean().nullable().optional(),
    emplannerIsVcs: z.boolean().nullable().optional(),
});

interface UserRouterDeps {
    userRepo: UserRepository;
    verifyToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireAuth: (req: Request, res: Response, next: NextFunction) => void;
}

export function createUserRouter({ userRepo, verifyToken, requireAuth }: UserRouterDeps): Router {
    const router = Router();
    const slackSync = new SlackSyncService(userRepo);
    const emplannerSync = new EmplannerSyncService(userRepo);

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

        // Автосинхронизация из Emplanner если не хватает полей
        if (user && (!user.emplannerUid || !user.extraId)) {
            const email = user.email;
            if (shouldAttemptSync('emplanner', email)) {
                try {
                    await emplannerSync.syncUserByEmail(email);
                    recordSyncSuccess('emplanner', email);
                    user = await userRepo.findById(req.user!.id);
                } catch (error) {
                    console.error('Emplanner sync failed:', error);
                    console.error('Emplanner sync error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
                    recordSyncFailure('emplanner', email);
                }
            }
        }

        res.json(user);
    });

    router.post('/reset-slack', async (req: AuthRequest, res: Response) => {
        const user = await userRepo.update(req.user!.id, { slackId: null } as any);
        res.json({ message: 'Slack ID cleared', user });
    });

    router.post('/sync-emplanner', async (req: AuthRequest, res: Response) => {
        try {
            await emplannerSync.syncUserByEmail(req.user!.email);
            const user = await userRepo.findById(req.user!.id);
            res.json({ message: 'Emplanner synced', user });
        } catch (error: any) {
            console.error('Force emplanner sync failed:', error);
            res.status(500).json({ error: error.message || 'Sync failed' });
        }
    });

    router.patch('/me', validate(updateProfileSchema), async (req: AuthRequest, res: Response) => {
        const user = await userRepo.update(req.user!.id, req.body);
        res.json(user);
    });

    return router;
}
