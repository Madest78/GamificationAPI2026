import { UserRepository } from '@/modules/users/user.repository.js';
import { EmplannerAdapter, EmplannerUser } from './adapter.js';

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

        // Определяем личную почту (gmail и другие не-corporate)
        const isGmail = emplannerUser.email.toLowerCase().endsWith('@gmail.com');
        const personalEmail = isGmail ? emplannerUser.email : null;

        await this.userRepo.update(existingUser.id, {
            emplannerUid: emplannerUser.id,
            extraId: emplannerUser.extraId,
            personalEmail: personalEmail,
            emplannerAvailability: emplannerUser.availability || null,
            emplannerRoles: emplannerUser.role || [],
            emplannerTags: emplannerUser.tags || [],
            emplannerCountry: emplannerUser.country || null,
            emplannerCity: emplannerUser.city || null,
            emplannerGender: emplannerUser.gender || null,
            emplannerFired: emplannerUser.fired || false,
            emplannerTimeTracking: emplannerUser.latestTimeTrackingEvent || null,
            emplannerUtc: emplannerUser.utc || null,
            emplannerTeams: {
                member: emplannerUser.memberTeams || [],
                leader: emplannerUser.leaderTeams || [],
            },
            emplannerProductivity: emplannerUser.calculatedProductivityAverage || null,
            emplannerFeedbackUrl: emplannerUser.feedbackUrl || null,
            emplannerHasOnlyTestLicenses: emplannerUser.hasOnlyTestLicenses || false,
            emplannerIsVcs: emplannerUser.isVcs || false,
        } as any);
    }
}
