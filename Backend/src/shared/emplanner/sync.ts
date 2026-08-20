import { UserRepository } from '@/modules/users/user.repository.js';
import { EmplannerAdapter } from './adapter.js';

export class EmplannerSyncService {
    private adapter: EmplannerAdapter;

    constructor(private userRepo: UserRepository) {
        this.adapter = new EmplannerAdapter();
    }

    async syncUserByEmail(email: string): Promise<void> {
        const emplannerUser = await this.adapter.getUserByEmail(email);

        if (!emplannerUser) {
            throw new Error(`User not found in Emplanner: ${email}`);
        }

        const existingUser = await this.userRepo.findByEmail(email);

        if (!existingUser) {
            throw new Error(`User not found in database: ${email}`);
        }

        await this.userRepo.update(existingUser.id, {
            emplannerUid: emplannerUser.id,
            extraId: emplannerUser.extraId,
        });
    }
}
