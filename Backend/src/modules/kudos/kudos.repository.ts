import {
    KudosTypeDto,
    KudosTransactionDto,
    UserKudosBalanceDto,
} from './kudos.interface.js';

export interface KudosRepository {
    // Kudos types
    findAllTypes(): Promise<KudosTypeDto[]>;
    findTypeById(id: string): Promise<KudosTypeDto | null>;

    // Transactions
    createTransaction(senderId: string, receiverId: string, kudosTypeId: string, message?: string): Promise<KudosTransactionDto>;
    findTransactionsByUser(userId: string): Promise<KudosTransactionDto[]>;

    // Balance
    getBalance(userId: string): Promise<UserKudosBalanceDto | null>;
    decrementBalance(userId: string): Promise<UserKudosBalanceDto>;
    resetBalance(userId: string): Promise<UserKudosBalanceDto>;

    // Atomic operations (for race condition prevention)
    sendKudosAtomic(senderId: string, receiverId: string, kudosTypeId: string, message?: string): Promise<KudosTransactionDto>;
}
