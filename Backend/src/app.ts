import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { requestId, logger } from './shared/middleware/index.js';
import { AppError } from './errors/AppErrors.js';
import { prisma } from './shared/prisma.js';
import { env } from './config/env.js';
import { PrismaUserRepository } from './modules/users/user.repository.prisma.js';
import { PrismaAuthRepository } from './modules/auth/auth.repository.prisma.js';
import { PrismaAchievementRepository } from './modules/achievements/achievement.repository.prisma.js';
import { PrismaKudosRepository } from './modules/kudos/kudos.repository.prisma.js';
import { PrismaFeedRepository } from './modules/feed/feed.repository.prisma.js';
import { AuthService } from './modules/auth/auth.service.js';
import { AchievementService } from './modules/achievements/achievement.service.js';
import { KudosService } from './modules/kudos/kudos.service.js';
import { FeedService } from './modules/feed/feed.service.js';
import { AdminService } from './modules/admin/admin.service.js';
import { createVerifyToken, requireAuth, requireRole } from './modules/auth/auth.middleware.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createAchievementRouter } from './modules/achievements/achievement.routes.js';
import { createKudosRouter } from './modules/kudos/kudos.routes.js';
import { createFeedRouter } from './modules/feed/feed.routes.js';
import { createAdminRouter } from './modules/admin/admin.routes.js';
import { createUserRouter } from './modules/users/user.routes.js';
import { createSyncRouter } from './modules/sync/sync.routes.js';
import { startScheduler, startWorkers, stopQueue, stopScheduler } from './shared/jobs/index.js';

const app = express();

// --- Repository instances ---
const userRepo = new PrismaUserRepository(prisma);
const authRepo = new PrismaAuthRepository(prisma);
const achievementRepo = new PrismaAchievementRepository(prisma);
const kudosRepo = new PrismaKudosRepository(prisma);
const feedRepo = new PrismaFeedRepository(prisma);

// --- Auth middleware ---
const verifyToken = createVerifyToken(authRepo, userRepo);

// --- Service instances ---
const authService = new AuthService(userRepo, authRepo);
const achievementService = new AchievementService(achievementRepo, userRepo);
const kudosService = new KudosService(kudosRepo, userRepo);
const feedService = new FeedService(userRepo, feedRepo);
const adminService = new AdminService(userRepo, achievementRepo);

// --- Security ---
app.use(helmet());

const allowedOrigins = env.ALLOWED_DOMAINS.split(',').map(d => `https://${d.trim()}`);
allowedOrigins.push(env.FRONTEND_URL);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// Rate limiting — общий лимит
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
});

// Rate limiting — для auth endpoints (строже)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many auth attempts, please try again later' },
});

app.use(generalLimiter);

// --- Middleware ---
app.use(express.json({ limit: '256kb' }));
app.use(requestId);
app.use(logger);

// --- Health endpoint (без rate limit) ---
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

// --- TEMP: Init superadmin (удалить после использования) ---
app.post('/api/init-superadmin', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email required' });
            return;
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const role = await prisma.role.findUnique({ where: { code: 'SUPERADMIN' } });
        if (!role) {
            res.status(500).json({ error: 'SUPERADMIN role not found. Run seed first.' });
            return;
        }
        const existing = await prisma.userRole.findUnique({
            where: { userId_roleId: { userId: user.id, roleId: role.id } },
        });
        if (existing) {
            res.json({ message: 'Already SUPERADMIN' });
            return;
        }
        await prisma.userRole.create({
            data: { userId: user.id, roleId: role.id },
        });
        res.json({ message: `${email} is now SUPERADMIN` });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Routes ---
app.use('/api/auth', authLimiter, createAuthRouter({ authService, verifyToken, requireAuth }));
app.use('/api/users', createUserRouter({ userRepo, verifyToken, requireAuth }));
app.use('/api/achievements', createAchievementRouter({ achievementService, verifyToken, requireAuth, requireRole }));
app.use('/api/kudos', createKudosRouter({ kudosService, verifyToken, requireAuth }));
app.use('/api/feed', createFeedRouter({ feedService, verifyToken, requireAuth }));
app.use('/api/admin', createAdminRouter({ adminService, verifyToken, requireAuth, requireRole }));
app.use('/api/sync', createSyncRouter({ userRepo, verifyToken, requireAuth, requireRole }));

// --- 404 handler ---
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
});

// --- Global error handler ---
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }

    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

// --- Job infrastructure initialization ---
export async function initializeJobs(): Promise<void> {
    try {
        await startScheduler();
        await startWorkers();
        console.log('[Jobs] Job infrastructure initialized');
    } catch (error) {
        console.error('[Jobs] Failed to initialize job infrastructure:', error);
    }
}

// --- Graceful shutdown ---
export async function shutdown(): Promise<void> {
    stopScheduler();
    await stopQueue();
    await prisma.$disconnect();
    console.log('[App] Shutdown complete');
}

export default app;
