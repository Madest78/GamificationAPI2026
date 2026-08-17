import { PrismaClient } from '@/generated/prisma/client.js';
import { KudosRepository } from './kudos.repository.js';
import {
    KudosTypeDto,
    KudosTransactionDto,
    UserKudosBalanceDto,
} from './kudos.interface.js';

export class PrismaKudosRepository implements KudosRepository {
    constructor(private prisma: PrismaClient) {}

    private toTypeDto(type: any): KudosTypeDto {
        return {
            id: type.id,
            code: type.code,
            name: type.name,
            emoji: type.emoji,
            description: type.description,
            createdAt: type.createdAt,
        };
    }

    private toTransactionDto(tx: any): KudosTransactionDto {
        return {
            id: tx.id,
            senderId: tx.senderId,
            receiverId: tx.receiverId,
            kudosTypeId: tx.kudosTypeId,
            message: tx.message,
            createdAt: tx.createdAt,
        };
    }

    private toBalanceDto(balance: any): UserKudosBalanceDto {
        return {
            id: balance.id,
            userId: balance.userId,
            balance: balance.balance,
            lastReset: balance.lastReset,
        };
    }

    // Kudos types
    async findAllTypes(): Promise<KudosTypeDto[]> {
        const types = await this.prisma.kudosType.findMany();
        return types.map(this.toTypeDto);
    }

    async findTypeById(id: string): Promise<KudosTypeDto | null> {
        const type = await this.prisma.kudosType.findUnique({ where: { id } });
        if (!type) return null;
        return this.toTypeDto(type);
    }

    // Transactions
    async createTransaction(senderId: string, receiverId: string, kudosTypeId: string, message?: string): Promise<KudosTransactionDto> {
        const tx = await this.prisma.kudosTransaction.create({
            data: { senderId, receiverId, kudosTypeId, message },
        });
        return this.toTransactionDto(tx);
    }

    async findTransactionsByUser(userId: string): Promise<KudosTransactionDto[]> {
        const txs = await this.prisma.kudosTransaction.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });
        return txs.map(this.toTransactionDto);
    }

    // Balance
    async getBalance(userId: string): Promise<UserKudosBalanceDto | null> {
        const balance = await this.prisma.userKudosBalance.findUnique({
            where: { userId },
        });
        if (!balance) return null;
        return this.toBalanceDto(balance);
    }

    async decrementBalance(userId: string): Promise<UserKudosBalanceDto> {
        const balance = await this.prisma.userKudosBalance.upsert({
            where: { userId },
            create: { userId, balance: 9 }, // Начальный баланс минус 1
            update: { balance: { decrement: 1 } },
        });
        return this.toBalanceDto(balance);
    }

    async resetBalance(userId: string): Promise<UserKudosBalanceDto> {
        const balance = await this.prisma.userKudosBalance.upsert({
            where: { userId },
            create: { userId, balance: 10, lastReset: new Date() },
            update: { balance: 10, lastReset: new Date() },
        });
        return this.toBalanceDto(balance);
    }

    async sendKudosAtomic(senderId: string, receiverId: string, kudosTypeId: string, message?: string): Promise<KudosTransactionDto> {
        return this.prisma.$transaction(async (tx) => {
            // Validate KudosType exists
            const kudosType = await tx.kudosType.findUnique({
                where: { id: kudosTypeId },
            });
            if (!kudosType) {
                throw new Error('KudosType not found');
            }

            // Check balance with lock
            const balance = await tx.userKudosBalance.findUnique({
                where: { userId: senderId },
            });

            if (!balance || balance.balance <= 0) {
                throw new Error('Insufficient kudos balance');
            }

            // Decrement balance
            await tx.userKudosBalance.update({
                where: { userId: senderId },
                data: { balance: { decrement: 1 } },
            });

            // Create transaction
            const txResult = await tx.kudosTransaction.create({
                data: { senderId, receiverId, kudosTypeId, message },
            });

            return this.toTransactionDto(txResult);
        });
    }
}
