import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import { env } from '@/config/env.js';
import { UnauthorizedError, ForbiddenError } from '@/errors/AppErrors.js';
import { AuthRepository } from './auth.repository.js';
import { UserRepository } from '../users/user.repository.js';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        roles: string[];
    };
}

export function createVerifyToken(authRepo: AuthRepository, userRepo: UserRepository) {
    return async function verifyToken(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                throw new UnauthorizedError('No token provided');
            }

            const token = authHeader.split(' ')[1];
            const secret = new TextEncoder().encode(env.JWT_SECRET);

            const { payload } = await jwtVerify(token, secret);

            const jti = payload.jti;
            if (jti) {
                const isRevoked = await authRepo.isTokenRevoked(jti);
                if (isRevoked) {
                    throw new UnauthorizedError('Token revoked');
                }
            }

            const user = await userRepo.findUserWithRoles(payload.sub as string);
            if (!user) {
                throw new UnauthorizedError('User not found');
            }

            req.user = {
                id: user.id,
                email: user.email,
                roles: user.roles,
            };

            next();
        } catch (error) {
            if (error instanceof UnauthorizedError) {
                throw error;
            }
            throw new UnauthorizedError('Invalid token');
        }
    };
}

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
    if (!req.user) {
        throw new UnauthorizedError('Authentication required');
    }
    next();
}

export function requireRole(...allowedRoles: string[]) {
    return (req: AuthRequest, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            throw new UnauthorizedError('Authentication required');
        }

        const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
        if (!hasRole) {
            throw new ForbiddenError('Insufficient permissions');
        }

        next();
    };
}
