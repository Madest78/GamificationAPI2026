import { SignJWT, jwtVerify } from 'jose';
import { env } from '@/config/env.js';
import { UserRepository } from '../users/user.repository.js';
import { AuthRepository } from './auth.repository.js';
import { UnauthorizedError, BadRequestError } from '@/errors/AppErrors.js';
import { createHash, randomBytes } from 'node:crypto';

// Время жизни токенов
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

interface GoogleUserInfo {
    id: string;      // Google userinfo API uses "id", not "sub"
    email: string;
    name?: string;
    picture?: string;
}

export class AuthService {
    constructor(
        private userRepo: UserRepository,
        private authRepo: AuthRepository,
    ) {}

    // Генерация JWT access токена
    private async generateAccessToken(userId: string, email: string, roles: string[]): Promise<string> {
        const secret = new TextEncoder().encode(env.JWT_SECRET);

        return new SignJWT({ email, roles })
            .setProtectedHeader({ alg: 'HS256' })
            .setSubject(userId)
            .setIssuedAt()
            .setExpirationTime(ACCESS_TOKEN_EXPIRY)
            .setJti(randomBytes(16).toString('hex'))
            .sign(secret);
    }

    // Генерация refresh токена
    private async generateRefreshToken(userId: string): Promise<{ token: string; hash: string }> {
        const token = randomBytes(40).toString('hex');
        const hash = createHash('sha256').update(token).digest('hex');

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

        await this.authRepo.createRefreshToken({
            tokenHash: hash,
            userId,
            expiresAt,
        });

        return { token, hash };
    }

    // Хеширование refresh токена для поиска
    private hashToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    // Обмен Google кода на токены
    async handleGoogleCallback(code: string): Promise<{ accessToken: string; refreshToken: string }> {
        // Обмен кода на Google access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: env.GOOGLE_CLIENT_ID,
                client_secret: env.GOOGLE_CLIENT_SECRET,
                redirect_uri: env.GOOGLE_CALLBACK_URL,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            throw new BadRequestError('Failed to exchange code for tokens');
        }

        const { access_token } = await tokenResponse.json() as { access_token: string };

        // Получаем информацию о пользователе из Google
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        if (!userResponse.ok) {
            throw new BadRequestError('Failed to fetch user info from Google');
        }

        const googleUser = await userResponse.json() as GoogleUserInfo;

        // Ищем или создаём пользователя
        let user = await this.userRepo.findByGoogleId(googleUser.id);

        if (!user) {
            // Проверяем по email
            user = await this.userRepo.findByEmail(googleUser.email);

            if (user) {
                // Обновляем googleId
                user = await this.userRepo.update(user.id, { googleId: googleUser.id } as any);
            } else {
                // Создаём нового пользователя
                user = await this.userRepo.create({
                    email: googleUser.email,
                    name: googleUser.name,
                    avatarUrl: googleUser.picture,
                    googleId: googleUser.id,
                });
            }
        }

        // Генерируем токены
        const roles = await this.userRepo.findRolesByUserId(user.id);
        const accessToken = await this.generateAccessToken(user.id, user.email, roles);
        const { token: refreshToken } = await this.generateRefreshToken(user.id);

        return { accessToken, refreshToken };
    }

    // Обновление access токена через refresh токен
    async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        const hash = this.hashToken(refreshToken);
        const tokenData = await this.authRepo.findRefreshToken(hash);

        if (!tokenData) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        if (new Date() > tokenData.expiresAt) {
            await this.authRepo.deleteRefreshToken(hash);
            throw new UnauthorizedError('Refresh token expired');
        }

        // Получаем пользователя
        const user = await this.userRepo.findById(tokenData.userId);
        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        // Удаляем старый refresh token
        await this.authRepo.deleteRefreshToken(hash);

        // Генерируем новые токены
        const roles = await this.userRepo.findRolesByUserId(user.id);
        const accessToken = await this.generateAccessToken(user.id, user.email, roles);
        const { token: newRefreshToken } = await this.generateRefreshToken(user.id);

        return { accessToken, refreshToken: newRefreshToken };
    }

    // Выход (отзыв токенов)
    async logout(userId: string, jti?: string): Promise<void> {
        if (jti) {
            await this.authRepo.revokeToken(jti, userId);
        }
        await this.authRepo.deleteRefreshTokensByUserId(userId);
    }

    // Получение текущего пользователя
    async getCurrentUser(userId: string) {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        // Автосинхронизация из Slack если не хватает полей
        if (!user.slackId || !user.avatarUrl) {
            const { shouldAttemptSync, recordSyncSuccess, recordSyncFailure } = await import('@/shared/syncCache.js');
            if (shouldAttemptSync('slack', user.email)) {
                try {
                    const { SlackSyncService } = await import('@/shared/slack/sync.js');
                    const slackSync = new SlackSyncService(this.userRepo);
                    await slackSync.syncUserByEmail(user.email);
                    recordSyncSuccess('slack', user.email);
                    const updatedUser = await this.userRepo.findById(userId);
                    if (updatedUser) return updatedUser;
                } catch (error) {
                    console.error('Slack sync failed:', error);
                    recordSyncFailure('slack', user.email);
                }
            }
        }

        return user;
    }
}
