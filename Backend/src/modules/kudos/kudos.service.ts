import { KudosRepository } from './kudos.repository.js';
import { UserRepository } from '../users/user.repository.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '@/errors/AppErrors.js';

const WEEKLY_LIMIT = 10;

export class KudosService {
    constructor(
        private kudosRepo: KudosRepository,
        private userRepo: UserRepository,
    ) {}

    // Получить все типы kudos
    async getAllTypes() {
        return this.kudosRepo.findAllTypes();
    }

    // Отправить kudos
    async sendKudos(senderId: string, receiverId: string, kudosTypeId: string, message?: string) {
        // Проверяем отправителя
        const sender = await this.userRepo.findById(senderId);
        if (!sender) {
            throw new NotFoundError('Sender not found');
        }

        // Проверяем получателя
        const receiver = await this.userRepo.findById(receiverId);
        if (!receiver) {
            throw new NotFoundError('Receiver not found');
        }

        // Нельзя отправлять себе
        if (senderId === receiverId) {
            throw new BadRequestError('Cannot send kudos to yourself');
        }

        // Проверяем тип kudos
        const kudosType = await this.kudosRepo.findTypeById(kudosTypeId);
        if (!kudosType) {
            throw new NotFoundError('Kudos type not found');
        }

        // Атомарная операция (проверка баланса + списание + создание транзакции)
        try {
            const transaction = await this.kudosRepo.sendKudosAtomic(senderId, receiverId, kudosTypeId, message);
            return transaction;
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === 'Insufficient kudos balance') {
                    throw new ForbiddenError('No kudos left this week');
                }
                if (error.message === 'KudosType not found') {
                    throw new NotFoundError('Kudos type not found');
                }
            }
            throw error;
        }
    }

    // Получить историю kudos пользователя
    async getHistory(userId: string) {
        return this.kudosRepo.findTransactionsByUser(userId);
    }

    // Получить баланс пользователя
    async getBalance(userId: string) {
        let balance = await this.kudosRepo.getBalance(userId);

        if (!balance) {
            // Создаем баланс с нуля
            balance = await this.kudosRepo.resetBalance(userId);
        }

        return balance;
    }

    // Сбросить баланс (вызывается по расписанию)
    async resetWeeklyBalance(userId: string) {
        return this.kudosRepo.resetBalance(userId);
    }
}
