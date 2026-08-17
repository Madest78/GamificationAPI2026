import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KudosService } from '../kudos.service.js';
import { KudosRepository } from '../kudos.repository.js';
import { UserRepository } from '../../users/user.repository.js';

describe('KudosService', () => {
    let kudosService: KudosService;
    let kudosRepo: ReturnType<typeof createMockKudosRepo>;
    let userRepo: ReturnType<typeof createMockUserRepo>;

    beforeEach(() => {
        vi.clearAllMocks();
        kudosRepo = createMockKudosRepo();
        userRepo = createMockUserRepo();
        kudosService = new KudosService(kudosRepo, userRepo);
    });

    describe('sendKudos', () => {
        const sender = {
            id: 'sender-1',
            email: 'sender@test.com',
            name: 'Sender',
            avatarUrl: null,
            emplannerUid: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const receiver = {
            id: 'receiver-1',
            email: 'receiver@test.com',
            name: 'Receiver',
            avatarUrl: null,
            emplannerUid: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const kudosType = {
            id: 'type-1',
            code: 'THANKS',
            name: 'Thanks',
            emoji: '🙏',
            description: 'Thank you!',
            createdAt: new Date(),
        };

        it('should send kudos successfully', async () => {
            userRepo.findById
                .mockResolvedValueOnce(sender)
                .mockResolvedValueOnce(receiver);
            kudosRepo.findTypeById.mockResolvedValue(kudosType);
            kudosRepo.sendKudosAtomic.mockResolvedValue({
                id: 'tx-1',
                senderId: 'sender-1',
                receiverId: 'receiver-1',
                kudosTypeId: 'type-1',
                message: 'Great job!',
                createdAt: new Date(),
            });

            const result = await kudosService.sendKudos(
                'sender-1',
                'receiver-1',
                'type-1',
                'Great job!'
            );

            expect(result.id).toBe('tx-1');
            expect(kudosRepo.sendKudosAtomic).toHaveBeenCalledWith(
                'sender-1',
                'receiver-1',
                'type-1',
                'Great job!'
            );
        });

        it('should throw if sending to yourself', async () => {
            userRepo.findById.mockResolvedValue(sender);

            await expect(
                kudosService.sendKudos('sender-1', 'sender-1', 'type-1')
            ).rejects.toThrow('Cannot send kudos to yourself');
        });

        it('should throw if sender not found', async () => {
            userRepo.findById.mockResolvedValue(null);

            await expect(
                kudosService.sendKudos('nonexistent', 'receiver-1', 'type-1')
            ).rejects.toThrow('Sender not found');
        });

        it('should throw if receiver not found', async () => {
            userRepo.findById
                .mockResolvedValueOnce(sender)
                .mockResolvedValueOnce(null);

            await expect(
                kudosService.sendKudos('sender-1', 'nonexistent', 'type-1')
            ).rejects.toThrow('Receiver not found');
        });

        it('should throw if kudos type not found', async () => {
            userRepo.findById
                .mockResolvedValueOnce(sender)
                .mockResolvedValueOnce(receiver);
            kudosRepo.findTypeById.mockResolvedValue(null);

            await expect(
                kudosService.sendKudos('sender-1', 'receiver-1', 'nonexistent')
            ).rejects.toThrow('Kudos type not found');
        });

        it('should throw if insufficient balance', async () => {
            userRepo.findById
                .mockResolvedValueOnce(sender)
                .mockResolvedValueOnce(receiver);
            kudosRepo.findTypeById.mockResolvedValue(kudosType);
            kudosRepo.sendKudosAtomic.mockRejectedValue(
                new Error('Insufficient kudos balance')
            );

            await expect(
                kudosService.sendKudos('sender-1', 'receiver-1', 'type-1')
            ).rejects.toThrow('No kudos left this week');
        });

        it('should throw if kudos type invalid in atomic op', async () => {
            userRepo.findById
                .mockResolvedValueOnce(sender)
                .mockResolvedValueOnce(receiver);
            kudosRepo.findTypeById.mockResolvedValue(kudosType);
            kudosRepo.sendKudosAtomic.mockRejectedValue(
                new Error('KudosType not found')
            );

            await expect(
                kudosService.sendKudos('sender-1', 'receiver-1', 'type-1')
            ).rejects.toThrow('Kudos type not found');
        });
    });

    describe('getAllTypes', () => {
        it('should return all kudos types', async () => {
            const types = [
                { id: '1', code: 'THANKS', name: 'Thanks', emoji: '🙏', description: null, createdAt: new Date() },
                { id: '2', code: 'GREAT', name: 'Great', emoji: '⭐', description: null, createdAt: new Date() },
            ];
            kudosRepo.findAllTypes.mockResolvedValue(types);

            const result = await kudosService.getAllTypes();
            expect(result).toHaveLength(2);
        });
    });

    describe('getBalance', () => {
        it('should return existing balance', async () => {
            const balance = { id: 'b1', userId: 'user-1', balance: 7, lastReset: new Date() };
            kudosRepo.getBalance.mockResolvedValue(balance);

            const result = await kudosService.getBalance('user-1');
            expect(result.balance).toBe(7);
        });

        it('should create balance if not exists', async () => {
            const newBalance = { id: 'b2', userId: 'user-1', balance: 10, lastReset: new Date() };
            kudosRepo.getBalance.mockResolvedValue(null);
            kudosRepo.resetBalance.mockResolvedValue(newBalance);

            const result = await kudosService.getBalance('user-1');
            expect(result.balance).toBe(10);
            expect(kudosRepo.resetBalance).toHaveBeenCalledWith('user-1');
        });
    });
});

function createMockKudosRepo(): KudosRepository {
    return {
        findAllTypes: vi.fn(),
        findTypeById: vi.fn(),
        createTransaction: vi.fn(),
        findTransactionsByUser: vi.fn(),
        getBalance: vi.fn(),
        decrementBalance: vi.fn(),
        resetBalance: vi.fn(),
        sendKudosAtomic: vi.fn(),
    };
}

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
    };
}
