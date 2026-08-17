import { CreateRefreshTokenDto, RefreshTokenDto } from './auth.interface.js';

export interface AuthRepository {
    createRefreshToken(data: CreateRefreshTokenDto): Promise<RefreshTokenDto>;
    findRefreshToken(tokenHash: string): Promise<RefreshTokenDto | null>;
    deleteRefreshToken(tokenHash: string): Promise<void>;
    deleteRefreshTokensByUserId(userId: string): Promise<void>;
    revokeToken(jti: string, userId: string): Promise<void>;
    isTokenRevoked(jti: string): Promise<boolean>;
}
