import { z } from 'zod';

const sendKudosSchema = z.object({
    receiverId: z.string(),
    kudosTypeId: z.string(),
    message: z.string().optional(),
});

type SendKudosDto = z.infer<typeof sendKudosSchema>;

interface KudosTypeDto {
    id: string;
    code: string;
    name: string;
    emoji: string;
    description: string | null;
    createdAt: Date;
}

interface KudosTransactionDto {
    id: string;
    senderId: string;
    receiverId: string;
    kudosTypeId: string;
    message: string | null;
    createdAt: Date;
}

interface UserKudosBalanceDto {
    id: string;
    userId: string;
    balance: number;
    lastReset: Date;
}

export {
    sendKudosSchema,
    SendKudosDto,
    KudosTypeDto,
    KudosTransactionDto,
    UserKudosBalanceDto,
};
