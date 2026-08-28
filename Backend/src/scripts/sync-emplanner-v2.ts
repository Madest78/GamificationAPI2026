import 'dotenv/config';
import { readFileSync } from 'fs';
import { prisma } from '@/shared/prisma.js';
import { EmplannerAdapter, EmplannerUser } from '@/shared/emplanner/adapter.js';
import { mapEmplannerTeamsToRoles } from '@/shared/emplanner/mapping.js';

const CSV_PATH = './corporate-emails-all.csv';

function escapeSQL(s: string): string {
    return s.replace(/'/g, "''");
}

async function main() {
    console.log('[SyncV2] Loading corporateEmail CSV...');
    const csvContent = readFileSync(CSV_PATH, 'utf-8');
    const csvLines = csvContent.trim().split('\n').slice(1);
    const uidToCorpEmail = new Map<string, string>();
    for (const line of csvLines) {
        const [id, corpEmail] = line.split('|');
        if (id && corpEmail) uidToCorpEmail.set(id.trim(), corpEmail.trim());
    }
    console.log(`[SyncV2] Loaded ${uidToCorpEmail.size} corporateEmail entries from CSV`);

    console.log('[SyncV2] Fetching all Emplanner users via paginated API...');
    const adapter = new EmplannerAdapter();
    const emplannerUsers = await adapter.getAllUsers();
    console.log(`[SyncV2] Got ${emplannerUsers.length} users from API`);

    // Enrich with corporateEmail from CSV
    for (const eu of emplannerUsers) {
        const corpEmail = uidToCorpEmail.get(eu.id);
        if (corpEmail) (eu as any).corporateEmail = corpEmail;
    }
    const enriched = emplannerUsers.filter(u => (u as any).corporateEmail);
    console.log(`[SyncV2] ${enriched.length}/${emplannerUsers.length} users enriched with corporateEmail`);

    const allowedDomains = new Set(['docusketch.com', 'emplanner.team']);

    // ── Load DB state ──
    const allDbUsers = await prisma.user.findMany({ select: { id: true, email: true, emplannerUid: true } });
    const emailToUserId = new Map(allDbUsers.map(u => [u.email.toLowerCase(), u.id]));
    const uidToUserId = new Map(allDbUsers.filter(u => u.emplannerUid).map(u => [u.emplannerUid!, u.id]));

    const allRoles = await prisma.role.findMany({ select: { id: true, code: true } });
    const allSpecs = await prisma.specialization.findMany({ select: { id: true, code: true } });
    const codeToRoleId = new Map(allRoles.map(r => [r.code, r.id]));
    const codeToSpecId = new Map(allSpecs.map(s => [s.code, s.id]));

    const allUserRoles = await prisma.userRole.findMany({
        select: { userId: true, role: { select: { code: true } } },
    });
    const allUserSpecs = await prisma.userSpecialization.findMany({
        select: { userId: true, specializationId: true },
    });
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

    const autoRoleCodes = new Set(['DRAFTER', 'TEAMLEAD', 'MEMBER']);
    const autoRoleIds = [...autoRoleCodes].map(c => codeToRoleId.get(c)).filter(Boolean) as string[];
    const manualRoles = new Set(['ADMIN', 'SUPERADMIN', 'PROFILES_ADMIN']);

    console.log(`[SyncV2] DB: ${allDbUsers.length} users, ${codeToRoleId.size} roles, ${codeToSpecId.size} specs`);

    // ── Compute changes ──
    let created = 0, updated = 0, skipped = 0, failed = 0;
    const seenEmails = new Set<string>();
    const userCreates: Array<{ email: string; name: string; data: Record<string, unknown> }> = [];
    const userUpdates: Array<{ userId: string; data: Record<string, unknown> }> = [];
    const rolesToCreate: Array<{ userId: string; roleId: string }> = [];
    const rolesToDelete: Array<{ userId: string; roleId: string }> = [];
    const specsToCreate: Array<{ userId: string; specializationId: string }> = [];
    const specsToDelete: Array<{ userId: string; specializationId: string }> = [];

    for (const eu of emplannerUsers) {
        const emailVal = eu.email || '';
        const corpEmailVal = (eu as any).corporateEmail || '';
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
            skipped++;
            continue;
        }

        const emailLower = primaryEmail.toLowerCase();
        if (seenEmails.has(emailLower)) { skipped++; continue; }
        seenEmails.add(emailLower);

        const existingUserId = emailToUserId.get(emailLower) || uidToUserId.get(eu.id);

        const mapping = mapEmplannerTeamsToRoles(eu.memberTeams || [], eu.leaderTeams || []);
        const emplannerData: Record<string, unknown> = {
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

        if (existingUserId) {
            // If email changed, update the lookup map
            if (!emailToUserId.has(emailLower)) {
                emailToUserId.set(emailLower, existingUserId);
            }

            userUpdates.push({ userId: existingUserId, data: emplannerData });

            const currentRoleCodes = userRoles.get(existingUserId) || new Set();
            const hasManualRole = [...currentRoleCodes].some(r => manualRoles.has(r));
            if (!hasManualRole) {
                const targetRoleIds = new Set(mapping.roles.map(c => codeToRoleId.get(c)).filter(Boolean) as string[]);
                for (const roleId of autoRoleIds) {
                    if (targetRoleIds.has(roleId) && !currentRoleCodes.has(allRoles.find(r => r.id === roleId)?.code || '')) {
                        rolesToCreate.push({ userId: existingUserId, roleId });
                    }
                    if (!targetRoleIds.has(roleId) && currentRoleCodes.has(allRoles.find(r => r.id === roleId)?.code || '')) {
                        rolesToDelete.push({ userId: existingUserId, roleId });
                    }
                }
            }

            const targetSpecIds = new Set(mapping.specializations.map(c => codeToSpecId.get(c)).filter(Boolean) as string[]);
            const currentSpecIds = userSpecIds.get(existingUserId) || new Set();
            for (const specId of targetSpecIds) {
                if (!currentSpecIds.has(specId)) specsToCreate.push({ userId: existingUserId, specializationId: specId });
            }
            for (const specId of currentSpecIds) {
                if (!targetSpecIds.has(specId)) specsToDelete.push({ userId: existingUserId, specializationId: specId });
            }

            updated++;
        } else {
            const name = [eu.firstName, eu.lastName].filter(Boolean).join(' ') || primaryEmail;
            userCreates.push({ email: primaryEmail, name, data: emplannerData });
        }
    }

    console.log(`[SyncV2] ${userCreates.length} creates, ${userUpdates.length} updates, ${skipped} skipped`);

    // ── Execute creates ──
    for (let i = 0; i < userCreates.length; i += 10) {
        const batch = userCreates.slice(i, i + 10);
        try {
            const results = await prisma.$transaction(
                batch.map(u => prisma.user.create({
                    data: { email: u.email, name: u.name, ...u.data } as any,
                    select: { id: true, email: true },
                })),
                { timeout: 30000 },
            );
            for (const r of results) {
                emailToUserId.set(r.email.toLowerCase(), r.id);
                created++;
            }
            console.log(`[SyncV2] Created ${Math.min(i + 10, userCreates.length)}/${userCreates.length}`);
        } catch (err) {
            console.error(`[SyncV2] Create batch failed:`, err);
            failed += batch.length;
        }
    }

    // ── Execute updates (batch SQL) ──
    for (let i = 0; i < userUpdates.length; i += 50) {
        const batch = userUpdates.slice(i, i + 50);
        const ids = batch.map(u => `'${escapeSQL(u.userId)}'`).join(',');
        // Update scalar fields only
        for (const u of batch) {
            try {
                await prisma.user.update({ where: { id: u.userId }, data: u.data as any });
            } catch (err) {
                console.error(`[SyncV2] Update failed for ${u.userId}:`, err);
                failed++;
            }
        }
    }

    // ── Execute role changes ──
    if (rolesToDelete.length > 0) {
        for (const r of rolesToDelete) {
            await prisma.userRole.deleteMany({ where: { userId: r.userId, roleId: r.roleId } });
        }
    }

    const allRolesToCreate = [...rolesToCreate];
    if (allRolesToCreate.length > 0) {
        for (let i = 0; i < allRolesToCreate.length; i += 100) {
            const batch = allRolesToCreate.slice(i, i + 100);
            const values = batch.map(r => `('${escapeSQL(r.userId)}', '${escapeSQL(r.roleId)}')`).join(',');
            await prisma.$executeRawUnsafe(
                `INSERT INTO "UserRole" ("userId", "roleId") VALUES ${values} ON CONFLICT DO NOTHING`
            );
        }
    }

    // ── Execute spec changes ──
    if (specsToDelete.length > 0) {
        for (const s of specsToDelete) {
            await prisma.userSpecialization.deleteMany({ where: { userId: s.userId, specializationId: s.specializationId } });
        }
    }
    const allSpecsToCreate = [...specsToCreate];
    if (allSpecsToCreate.length > 0) {
        for (let i = 0; i < allSpecsToCreate.length; i += 100) {
            const batch = allSpecsToCreate.slice(i, i + 100);
            const values = batch.map(s => `('${escapeSQL(s.userId)}', '${escapeSQL(s.specializationId)}')`).join(',');
            await prisma.$executeRawUnsafe(
                `INSERT INTO "UserSpecialization" ("userId", "specializationId") VALUES ${values} ON CONFLICT DO NOTHING`
            );
        }
    }

    const total = await prisma.user.count();
    console.log(`\n[SyncV2] Done! ${created} created, ${updated} updated, ${skipped} skipped, ${failed} failed`);
    console.log(`[SyncV2] Total users in DB: ${total}`);

    await prisma.$disconnect();
}

main().catch(err => { console.error('[SyncV2] Fatal:', err); process.exit(1); });
