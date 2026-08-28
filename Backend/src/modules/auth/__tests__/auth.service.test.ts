import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/config/env.js', () => ({
    env: {
        JWT_SECRET: 'test-secret-key-at-least-32-characters-long!!',
        GOOGLE_CLIENT_ID: 'test-client-id',
        GOOGLE_CLIENT_SECRET: 'test-client-secret',
        GOOGLE_CALLBACK_URL: 'http://localhost:3000/api/auth/google/callback',
        FRONTEND_URL: 'http://localhost:3001',
        ALLOWED_DOMAINS: 'test.com',
    },
}));

import { AuthService } from '../auth.service.js';
import { UserRepository } from '../../users/user.repository.js';
import { AuthRepository } from '../auth.repository.js';

vi.mock('jose', () => ({
    SignJWT: class {
        setProtectedHeader() { return this; }
        setSubject() { return this; }
        setIssuedAt() { return this; }
        setExpirationTime() { return this; }
        setJti() { return this; }
        sign() { return Promise.resolve('mock-jwt-token'); }
    },
    jwtVerify: vi.fn(),
}));

describe('AuthService', () => {
    let authService: AuthService;
    let userRepo: ReturnType<typeof createMockUserRepo>;
    let authRepo: ReturnType<typeof createMockAuthRepo>;

    beforeEach(() => {
        vi.clearAllMocks();
        userRepo = createMockUserRepo();
        authRepo = createMockAuthRepo();
        authService = new AuthService(userRepo, authRepo);
    });

    describe('handleGoogleCallback', () => {
        it('should create new user and return tokens', async () => {
            // Mock Google token exchange
            vi.stubGlobal('fetch', vi.fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ access_token: 'google-token' }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        sub: 'google-123',
                        email: 'test@example.com',
                        name: 'Test User',
                        picture: 'https://example.com/avatar.jpg',
                    }),
                })
            );

            userRepo.findByGoogleId.mockResolvedValue(null);
            userRepo.findByEmail.mockResolvedValue(null);
            userRepo.create.mockResolvedValue({
                id: 'user-1',
                email: 'test@example.com',
                name: 'Test User',
                avatarUrl: 'https://example.com/avatar.jpg',
                emplannerUid: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            userRepo.findRolesByUserId.mockResolvedValue(['DRAFTER']);
            authRepo.createRefreshToken.mockResolvedValue({
                id: 'token-1',
                tokenHash: 'hash',
                userId: 'user-1',
                expiresAt: new Date(),
                createdAt: new Date(),
            });

            const result = await authService.handleGoogleCallback('auth-code');

            expect(result.accessToken).toBe('mock-jwt-token');
            expect(result.refreshToken).toBeDefined();
            expect(userRepo.create).toHaveBeenCalledWith({
                email: 'test@example.com',
                name: 'Test User',
                avatarUrl: 'https://example.com/avatar.jpg',
                googleId: 'google-123',
            });
        });

        it('should update googleId for existing user by email', async () => {
            vi.stubGlobal('fetch', vi.fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ access_token: 'google-token' }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        sub: 'google-456',
                        email: 'existing@example.com',
                        name: 'Existing User',
                    }),
                })
            );

            const existingUser = {
                id: 'user-2',
                email: 'existing@example.com',
                name: 'Existing User',
                avatarUrl: null,
                emplannerUid: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            userRepo.findByGoogleId.mockResolvedValue(null);
            userRepo.findByEmail.mockResolvedValue(existingUser);
            userRepo.update.mockResolvedValue({ ...existingUser, emplannerUid: null });
            userRepo.findRolesByUserId.mockResolvedValue(['MEMBER']);
            authRepo.createRefreshToken.mockResolvedValue({
                id: 'token-2',
                tokenHash: 'hash',
                userId: 'user-2',
                expiresAt: new Date(),
                createdAt: new Date(),
            });

            const result = await authService.handleGoogleCallback('auth-code');

            expect(result.accessToken).toBe('mock-jwt-token');
            expect(userRepo.update).toHaveBeenCalled();
            expect(userRepo.create).not.toHaveBeenCalled();
        });
    });

    describe('getCurrentUser', () => {
        it('should return user if found', async () => {
            const user = {
                id: 'user-1',
                email: 'test@example.com',
                name: 'Test',
                avatarUrl: null,
                emplannerUid: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            userRepo.findById.mockResolvedValue(user);

            const result = await authService.getCurrentUser('user-1');
            expect(result).toEqual(user);
        });

        it('should throw if user not found', async () => {
            userRepo.findById.mockResolvedValue(null);

            await expect(authService.getCurrentUser('nonexistent')).rejects.toThrow('User not found');
        });
    });

    describe('logout', () => {
        it('should delete refresh tokens', async () => {
            authRepo.deleteRefreshTokensByUserId.mockResolvedValue();

            await authService.logout('user-1');

            expect(authRepo.deleteRefreshTokensByUserId).toHaveBeenCalledWith('user-1');
        });
    });
});

function createMockUserRepo(): UserRepository {
    return {
        findById: vi.fn(),
        findByEmail: vi.fn(),
        findByGoogleId: vi.fn(),
        findByEmplannerUid: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findRolesByUserId: vi.fn(),
        findUserWithRoles: vi.fn(),
        findSpecializationsByUserId: vi.fn(),
    };
}

function createMockAuthRepo(): AuthRepository {
    return {
        createRefreshToken: vi.fn(),
        findRefreshToken: vi.fn(),
        deleteRefreshToken: vi.fn(),
        deleteRefreshTokensByUserId: vi.fn(),
        revokeToken: vi.fn(),
        isTokenRevoked: vi.fn(),
    };
}
