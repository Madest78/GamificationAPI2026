import { PrismaClient } from '@/generated/prisma/client.js';
import { AuthRepository } from './auth.repository.js';
import { CreateRefreshTokenDto, RefreshTokenDto } from './auth.interface.js';

export class PrismaAuthRepository implements AuthRepository {
    constructor(private prisma: PrismaClient) {}

    private toDto(token: any): RefreshTokenDto {
        return {
            id: token.id,
            tokenHash: token.tokenHash,
            userId: token.userId,
            expiresAt: token.expiresAt,
            createdAt: token.createdAt,
        };
    }

    async createRefreshToken(data: CreateRefreshTokenDto): Promise<RefreshTokenDto> {
        const token = await this.prisma.refreshToken.create({ data });
        return this.toDto(token);
    }

    async findRefreshToken(tokenHash: string): Promise<RefreshTokenDto | null> {
        const token = await this.prisma.refreshToken.findUnique({
            where: { tokenHash },
        });
        if (!token) return null;
        return this.toDto(token);
    }

    async deleteRefreshToken(tokenHash: string): Promise<void> {
        await this.prisma.refreshToken.delete({
            where: { tokenHash },
        });
    }

    async deleteRefreshTokensByUserId(userId: string): Promise<void> {
        await this.prisma.refreshToken.deleteMany({
            where: { userId },
        });
    }

    async revokeToken(jti: string, userId: string): Promise<void> {
        await this.prisma.revokedToken.create({
            data: { jti, userId },
        });
    }

    async isTokenRevoked(jti: string): Promise<boolean> {
        const revoked = await this.prisma.revokedToken.findUnique({
            where: { jti },
        });
        return revoked !== null;
    }
}
