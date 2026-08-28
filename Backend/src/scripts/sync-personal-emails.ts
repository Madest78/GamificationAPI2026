import 'dotenv/config';
import { readFileSync } from 'fs';
import { prisma } from '@/shared/prisma.js';

const CSV_PATH = './corporate-emails-all.csv';

interface CsvRow {
    emplannerUid: string;
    personalEmail: string;
    email: string;
}

function parseCsv(filePath: string): CsvRow[] {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    const rows: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split('|');
        if (parts.length >= 2) {
            rows.push({
                emplannerUid: parts[0].trim(),
                personalEmail: parts[1]?.trim() || '',
                email: parts[2]?.trim() || '',
            });
        }
    }
    return rows;
}

function escapeSQL(s: string): string {
    return s.replace(/'/g, "''");
}

async function main() {
    console.log('[SyncPersonalEmails] Loading CSV...');
    const csvRows = parseCsv(CSV_PATH);
    console.log(`[SyncPersonalEmails] Loaded ${csvRows.length} rows`);

    const uidToPersonalEmail = new Map<string, string>();
    for (const row of csvRows) {
        if (row.emplannerUid && row.personalEmail) {
            uidToPersonalEmail.set(row.emplannerUid, row.personalEmail);
        }
    }
    console.log(`[SyncPersonalEmails] ${uidToPersonalEmail.size} users with personalEmail`);

    const dbUsers = await prisma.user.findMany({
        where: { emplannerUid: { not: null } },
        select: { id: true, emplannerUid: true, personalEmail: true },
    });
    console.log(`[SyncPersonalEmails] ${dbUsers.length} DB users with emplannerUid`);

    const updates: Array<{ userId: string; personalEmail: string }> = [];
    let skipped = 0;

    for (const user of dbUsers) {
        if (!user.emplannerUid) continue;
        const pe = uidToPersonalEmail.get(user.emplannerUid);
        if (!pe) continue;
        if (user.personalEmail === pe) { skipped++; continue; }
        updates.push({ userId: user.id, personalEmail: pe });
    }

    console.log(`[SyncPersonalEmails] ${updates.length} to update, ${skipped} already correct`);

    // Bulk update in batches of 50
    for (let i = 0; i < updates.length; i += 50) {
        const batch = updates.slice(i, i + 50);
        const cases = batch.map(u => `WHEN id='${escapeSQL(u.userId)}' THEN '${escapeSQL(u.personalEmail)}'`).join(' ');
        const ids = batch.map(u => `'${escapeSQL(u.userId)}'`).join(',');
        await prisma.$executeRawUnsafe(
            `UPDATE "User" SET "personalEmail" = CASE ${cases} END WHERE id IN (${ids})`
        );
        console.log(`[SyncPersonalEmails] Updated ${Math.min(i + 50, updates.length)}/${updates.length}`);
    }

    const final = await prisma.user.count({ where: { personalEmail: { not: null } } });
    console.log(`[SyncPersonalEmails] Done. Users with personalEmail: ${final}/${dbUsers.length}`);
    await prisma.$disconnect();
}

main().catch((err) => { console.error('[SyncPersonalEmails] Fatal:', err); process.exit(1); });
