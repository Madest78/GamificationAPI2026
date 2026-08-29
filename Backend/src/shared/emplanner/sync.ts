import { UserRepository } from '@/modules/users/user.repository.js';
import { EmplannerAdapter, EmplannerUser } from './adapter.js';
import { mapEmplannerTeamsToRoles } from './mapping.js';
import { prisma } from '@/shared/prisma.js';

export interface SyncAllResult {
    total: number;
    synced: number;
    created: number;
    skipped: number;
    failed: number;
}

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

        // API field naming is counterintuitive: corporateEmail = personal email
        const personalEmail = emplannerUser.corporateEmail || null;

        const mapping = mapEmplannerTeamsToRoles(
            emplannerUser.memberTeams || [],
            emplannerUser.leaderTeams || [],
        );

        const allRoles = await prisma.role.findMany({ select: { id: true, code: true } });
        const codeToRoleId = new Map(allRoles.map((r) => [r.code, r.id]));

        const allSpecs = await prisma.specialization.findMany({ select: { id: true, code: true } });
        const codeToSpecId = new Map(allSpecs.map((s) => [s.code, s.id]));

        await prisma.$transaction([
            prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    emplannerUid: emplannerUser.id,
                    extraId: emplannerUser.extraId,
                    personalEmail,
                    emplannerRoles: emplannerUser.role || [],
                    emplannerTags: emplannerUser.tags || [],
                    emplannerCountry: emplannerUser.country || null,
                    emplannerCity: emplannerUser.city || null,
                    emplannerGender: emplannerUser.gender || null,
                    emplannerFired: emplannerUser.fired || false,
                    emplannerUtc: emplannerUser.utc ?? null,
                    emplannerTeams: { member: emplannerUser.memberTeams || [], leader: emplannerUser.leaderTeams || [] },
                    emplannerProductivity: (emplannerUser.calculatedProductivityAverage as any) || undefined,
                    emplannerFeedbackUrl: emplannerUser.feedbackUrl || null,
                    emplannerHasOnlyTestLicenses: emplannerUser.hasOnlyTestLicenses || false,
                    emplannerIsVcs: emplannerUser.isVcs || false,
                    lastSyncedAt: new Date(),
                },
            }),
            prisma.userRole.deleteMany({
                where: { userId: existingUser.id, role: { code: { in: ['DRAFTER', 'TEAMLEAD', 'MEMBER'] } } },
            }),
            ...mapping.roles.map((code) => {
                const roleId = codeToRoleId.get(code);
                return roleId
                    ? prisma.userRole.create({ data: { userId: existingUser.id, roleId } })
                    : prisma.userRole.deleteMany({ where: { userId: '__none__' } });
            }),
            prisma.userSpecialization.deleteMany({ where: { userId: existingUser.id } }),
            ...mapping.specializations.map((code) => {
                const specId = codeToSpecId.get(code);
                return specId
                    ? prisma.userSpecialization.create({ data: { userId: existingUser.id, specializationId: specId } })
                    : prisma.userSpecialization.deleteMany({ where: { userId: '__none__' } });
            }),
        ]);
    }

    /**
     * Полный синк: создаёт новых юзеров с @docusketch.com/@emplanner.team,
     * обновляет существующих. ~8 запросов к БД.
     */
    async syncAllUsers(): Promise<SyncAllResult> {
        const emplannerUsers = await this.adapter.getAllUsers();
        const result: SyncAllResult = { total: emplannerUsers.length, synced: 0, created: 0, skipped: 0, failed: 0 };

        const allowedDomains = new Set(['docusketch.com', 'emplanner.team']);

        // ── Phase 1: Load DB state ──────────────────────────────────
        const [allDbUsers, allRoles, allSpecs, allUserRoles, allUserSpecs] = await Promise.all([
            prisma.user.findMany({ select: { id: true, email: true } }),
            prisma.role.findMany({ select: { id: true, code: true } }),
            prisma.specialization.findMany({ select: { id: true, code: true } }),
            prisma.userRole.findMany({
                select: { userId: true, roleId: true, role: { select: { code: true } } },
            }),
            prisma.userSpecialization.findMany({
                select: { userId: true, specializationId: true },
            }),
        ]);

        const emailToUserId = new Map(allDbUsers.map((u) => [u.email.toLowerCase(), u.id]));
        const codeToRoleId = new Map(allRoles.map((r) => [r.code, r.id]));
        const codeToSpecId = new Map(allSpecs.map((s) => [s.code, s.id]));
        const manualRoles = new Set(['ADMIN', 'SUPERADMIN', 'PROFILES_ADMIN']);
        const autoRoleCodes = new Set(['DRAFTER', 'TEAMLEAD', 'MEMBER']);
        const autoRoleIds = [...autoRoleCodes].map((c) => codeToRoleId.get(c)).filter(Boolean) as string[];

        const userRoles = new Map<string, Set<string>>();
        for (const ur of allUserRoles) {
            if (!userRoles.has(ur.userId)) userRoles.set(ur.userId, new Set());
            userRoles.get(ur.userId)!.add(ur.role.code);
        }
        const userSpecIds = new Map<string, Set<string>>();
        for (const us of allUserSpecs) {
            if (!userSpecIds.has(us.userId)) userSpecIds.set(us.userId, new Set());
            userSpecIds.get(us.userId)!.add(us.specializationId);
        }

        console.log(`[EmplannerSync] Loaded: ${emailToUserId.size} DB users, ${codeToRoleId.size} roles, ${codeToSpecId.size} specs`);

        // ── Phase 2: Compute desired state in memory ────────────────
        interface UserCreate {
            email: string;
            name: string;
            data: Record<string, unknown>;
        }
        interface UserUpdate {
            userId: string;
            data: Record<string, unknown>;
        }
        interface RoleChange {
            userId: string;
            roleId: string;
        }
        interface SpecChange {
            userId: string;
            specializationId: string;
        }

        const userCreates: UserCreate[] = [];
        const userUpdates: UserUpdate[] = [];
        const rolesToDelete: RoleChange[] = [];
        const rolesToCreate: RoleChange[] = [];
        const specsToDelete: SpecChange[] = [];
        const specsToCreate: SpecChange[] = [];
        const seenEmails = new Set<string>();

        for (const eu of emplannerUsers) {
            // Check BOTH fields for corporate domain
            const emailVal = eu.email || '';
            const corpEmailVal = eu.corporateEmail || '';
            const emailDomain = emailVal.split('@')[1]?.toLowerCase() || '';
            const corpDomain = corpEmailVal.split('@')[1]?.toLowerCase() || '';

            let primaryEmail = '';
            let personalEmail: string | null = null;

            if (allowedDomains.has(emailDomain)) {
                primaryEmail = emailVal;
                personalEmail = corpEmailVal || null;
            } else if (allowedDomains.has(corpDomain)) {
                primaryEmail = corpEmailVal;
                personalEmail = emailVal || null;
            } else {
                result.skipped++;
                continue;
            }

            const emailLower = primaryEmail.toLowerCase();
            if (seenEmails.has(emailLower)) {
                result.skipped++;
                continue;
            }
            seenEmails.add(emailLower);

            const existingUserId = emailToUserId.get(emailLower);

            const emplannerData = {
                emplannerUid: eu.id,
                extraId: eu.extraId,
                personalEmail,
                emplannerRoles: eu.role || [],
                emplannerTags: eu.tags || [],
                emplannerCountry: eu.country || null,
                emplannerCity: eu.city || null,
                emplannerGender: eu.gender || null,
                emplannerFired: eu.fired || false,
                emplannerUtc: eu.utc ?? null,
                emplannerTeams: { member: eu.memberTeams || [], leader: eu.leaderTeams || [] },
                emplannerProductivity: (eu.calculatedProductivityAverage as any) || undefined,
                emplannerFeedbackUrl: eu.feedbackUrl || null,
                emplannerHasOnlyTestLicenses: eu.hasOnlyTestLicenses || false,
                emplannerIsVcs: eu.isVcs || false,
                lastSyncedAt: new Date(),
            };

            const mapping = mapEmplannerTeamsToRoles(eu.memberTeams || [], eu.leaderTeams || []);

            if (existingUserId) {
                // Update existing user
                userUpdates.push({ userId: existingUserId, data: emplannerData });

                const currentRoleCodes = userRoles.get(existingUserId) || new Set();
                const hasManualRole = [...currentRoleCodes].some((r) => manualRoles.has(r));

                if (!hasManualRole) {
                    const targetRoleIds = new Set(mapping.roles.map((c) => codeToRoleId.get(c)).filter(Boolean) as string[]);
                    for (const roleId of autoRoleIds) {
                        if (targetRoleIds.has(roleId) && !currentRoleCodes.has(allRoles.find((r) => r.id === roleId)?.code || '')) {
                            rolesToCreate.push({ userId: existingUserId, roleId });
                        }
                        if (!targetRoleIds.has(roleId) && currentRoleCodes.has(allRoles.find((r) => r.id === roleId)?.code || '')) {
                            rolesToDelete.push({ userId: existingUserId, roleId });
                        }
                    }
                }

                const targetSpecIds = new Set(mapping.specializations.map((c) => codeToSpecId.get(c)).filter(Boolean) as string[]);
                const currentSpecIds = userSpecIds.get(existingUserId) || new Set();
                for (const specId of targetSpecIds) {
                    if (!currentSpecIds.has(specId)) specsToCreate.push({ userId: existingUserId, specializationId: specId });
                }
                for (const specId of currentSpecIds) {
                    if (!targetSpecIds.has(specId)) specsToDelete.push({ userId: existingUserId, specializationId: specId });
                }

                result.synced++;
            } else {
                // Create new user
                const name = [eu.firstName, eu.lastName].filter(Boolean).join(' ') || primaryEmail;
                userCreates.push({ email: primaryEmail, name, data: emplannerData });
            }
        }

        console.log(`[EmplannerSync] Computed: ${userCreates.length} creates, ${userUpdates.length} updates, ${result.skipped} skipped`);

        // ── Phase 3: Bulk DB operations ─────────────────────────────
        // Create new users in batches
        const createdUserIds: Array<{ email: string; userId: string }> = [];
        for (let i = 0; i < userCreates.length; i += 10) {
            const batch = userCreates.slice(i, i + 10);
            const results = await prisma.$transaction(
                batch.map((u) =>
                    prisma.user.create({
                        data: {
                            email: u.email,
                            name: u.name,
                            ...u.data,
                        } as any,
                        select: { id: true, email: true },
                    })
                ),
                { timeout: 30000 },
            );
            for (const r of results) {
                createdUserIds.push({ email: r.email, userId: r.id });
                emailToUserId.set(r.email.toLowerCase(), r.id);
            }
            console.log(`[EmplannerSync] Created ${Math.min(i + 10, userCreates.length)}/${userCreates.length} users`);
        }

        // Assign roles and specs to newly created users
        const newRolesToCreate: RoleChange[] = [];
        const newSpecsToCreate: SpecChange[] = [];

        for (const eu of emplannerUsers) {
            // Re-derive primaryEmail with same logic
            const emailVal = eu.email || '';
            const corpEmailVal = eu.corporateEmail || '';
            const emailDomain = emailVal.split('@')[1]?.toLowerCase() || '';
            const corpDomain = corpEmailVal.split('@')[1]?.toLowerCase() || '';
            let primaryEmail = '';
            if (allowedDomains.has(emailDomain)) {
                primaryEmail = emailVal;
            } else if (allowedDomains.has(corpDomain)) {
                primaryEmail = corpEmailVal;
            }
            if (!primaryEmail) continue;

            const emailLower = primaryEmail.toLowerCase();
            const userId = emailToUserId.get(emailLower);
            if (!userId) continue;

            const wasJustCreated = createdUserIds.some((c) => c.email.toLowerCase() === emailLower);
            if (!wasJustCreated) continue;

            const mapping = mapEmplannerTeamsToRoles(eu.memberTeams || [], eu.leaderTeams || []);

            for (const roleCode of mapping.roles) {
                const roleId = codeToRoleId.get(roleCode);
                if (roleId) newRolesToCreate.push({ userId, roleId });
            }
            for (const specCode of mapping.specializations) {
                const specId = codeToSpecId.get(specCode);
                if (specId) newSpecsToCreate.push({ userId, specializationId: specId });
            }
        }

        // Bulk update existing users — individual queries (faster than transactions for remote DB)
        for (const u of userUpdates) {
            try {
                await prisma.user.update({ where: { id: u.userId }, data: u.data as any });
            } catch (error) {
                console.error(`[EmplannerSync] Failed to update ${u.userId}:`, error);
                result.failed++;
            }
        }

        // Bulk delete old roles
        if (rolesToDelete.length > 0) {
            await prisma.$transaction(
                rolesToDelete.map((r) =>
                    prisma.userRole.deleteMany({ where: { userId: r.userId, roleId: r.roleId } })
                ),
                { timeout: 30000 },
            );
        }

        // Bulk create all new roles (existing + new users) — skip duplicates
        const allRolesToCreate = [...rolesToCreate, ...newRolesToCreate];
        if (allRolesToCreate.length > 0) {
            for (let i = 0; i < allRolesToCreate.length; i += 100) {
                const batch = allRolesToCreate.slice(i, i + 100);
                const values = batch.map((r) => `('${r.userId}', '${r.roleId}')`).join(',');
                await prisma.$executeRawUnsafe(
                    `INSERT INTO "UserRole" ("userId", "roleId") VALUES ${values} ON CONFLICT DO NOTHING`,
                );
            }
        }

        // Bulk delete old specs
        if (specsToDelete.length > 0) {
            await prisma.$transaction(
                specsToDelete.map((s) =>
                    prisma.userSpecialization.deleteMany({ where: { userId: s.userId, specializationId: s.specializationId } })
                ),
                { timeout: 30000 },
            );
        }

        // Bulk create all new specs — skip duplicates
        const allSpecsToCreate = [...specsToCreate, ...newSpecsToCreate];
        if (allSpecsToCreate.length > 0) {
            for (let i = 0; i < allSpecsToCreate.length; i += 100) {
                const batch = allSpecsToCreate.slice(i, i + 100);
                const values = batch.map((s) => `('${s.userId}', '${s.specializationId}')`).join(',');
                await prisma.$executeRawUnsafe(
                    `INSERT INTO "UserSpecialization" ("userId", "specializationId") VALUES ${values} ON CONFLICT DO NOTHING`,
                );
            }
        }

        console.log(`[EmplannerSync] Done: ${result.synced} updated, ${result.created} created, ${result.skipped} skipped, ${result.failed} failed`);
        return result;
    }
}
