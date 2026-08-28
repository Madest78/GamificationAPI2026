import { EmplannerAdapter } from '@/shared/emplanner/adapter.js';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';

const OUTPUT = '/tmp/corporate-emails-all.csv';
const PROGRESS = '/tmp/corp-email-progress.json';
const DELAY = 10;

async function main() {
    const adapter = new EmplannerAdapter() as any;
    const token = await adapter.getSessionToken();
    console.log('Got Bearer token');

    // Get all user IDs
    const users = await adapter.getAllUsers();
    const ids = users.map((u: any) => u.id);
    console.log(`Total users: ${ids.length}`);

    // Load progress
    let done: Record<string, { corp: string; email: string }> = {};
    let pending = ids;
    if (existsSync(PROGRESS)) {
        const p = JSON.parse(readFileSync(PROGRESS, 'utf8'));
        done = p.done || {};
        pending = ids.filter((id: string) => !done[id]);
        console.log(`Resuming: ${Object.keys(done).length} done, ${pending.length} pending`);
    }

    writeFileSync(OUTPUT, 'id|corporateEmail|email\n');

    for (let i = 0; i < pending.length; i++) {
        const id = pending[i];
        try {
            const raw = execSync(
                `curl -s 'https://app.emplanner.team/rest/v3/user/${id}' -H 'Authorization: Bearer ${token}' -H 'Accept: application/json'`,
                { encoding: 'utf-8', timeout: 15000 }
            );
            const data = JSON.parse(raw);
            const d = data.details || {};
            const corp = d.corporateEmail || '';
            const email = d.email || '';
            done[id] = { corp, email };
            writeFileSync(OUTPUT, `${id}|${corp}|${email}\n`, { flag: 'a' });
        } catch {
            done[id] = { corp: '', email: '' };
            writeFileSync(OUTPUT, `${id}||\n`, { flag: 'a' });
        }

        const total = Object.keys(done).length;
        if (total % 10 === 0) {
            console.log(`[${total}/${ids.length}] ${id}: corp=${done[id]?.corp} email=${done[id]?.email}`);
            writeFileSync(PROGRESS, JSON.stringify({ done }));
        }

        await new Promise(r => setTimeout(r, DELAY * 1000));
    }

    writeFileSync(PROGRESS, JSON.stringify({ done }));
    console.log(`\nDone! ${Object.keys(done).length} users saved to ${OUTPUT}`);
}

main().catch(console.error);
