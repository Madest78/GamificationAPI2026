import 'dotenv/config';
import { readFileSync } from 'fs';
import { SlackAdapter } from '@/shared/slack/adapter.js';

async function main() {
    // Load Emplanner data (all emails we know from Emplanner)
    const csvContent = readFileSync('./corporate-emails-all.csv', 'utf-8');
    const csvLines = csvContent.trim().split('\n').slice(1);
    
    const emplannerEmails = new Set<string>();
    const emplannerCorpEmails = new Map<string, string>(); // corpEmail -> primaryEmail
    
    for (const line of csvLines) {
        const [id, corpEmail, email] = line.split('|');
        if (email) emplannerEmails.add(email.toLowerCase().trim());
        if (corpEmail) emplannerEmails.add(corpEmail.toLowerCase().trim());
        if (corpEmail && email) emplannerCorpEmails.set(corpEmail.toLowerCase().trim(), email.toLowerCase().trim());
    }
    console.log('Emplanner emails (all):', emplannerEmails.size);

    // Fetch Slack users
    const adapter = new SlackAdapter();
    const allSlackUsers = await adapter.getAllUsers();
    
    const slackByEmail = new Map<string, { id: string; name: string; realName?: string }>();
    for (const su of allSlackUsers) {
        if (su.deleted || su.is_bot) continue;
        const email = su.profile?.email?.toLowerCase();
        if (email) slackByEmail.set(email, { id: su.id, name: su.name, realName: su.profile?.real_name });
    }
    console.log('Active Slack users with email:', slackByEmail.size);

    // Check: how many Slack users are in Emplanner?
    let slackInEmplanner = 0;
    let slackNotInEmplanner = 0;
    const notInEmplanner: Array<{ email: string; name: string }> = [];
    
    for (const [email, slack] of slackByEmail) {
        if (emplannerEmails.has(email)) {
            slackInEmplanner++;
        } else {
            slackNotInEmplanner++;
            notInEmplanner.push({ email, name: slack.realName || slack.name });
        }
    }

    console.log('\n=== RESULT ===');
    console.log('Slack users found in Emplanner:', slackInEmplanner);
    console.log('Slack users NOT in Emplanner:', slackNotInEmplanner);
    
    // Show first 30 not in Emplanner
    console.log('\nFirst 30 Slack users NOT in Emplanner:');
    for (const u of notInEmplanner.slice(0, 30)) {
        console.log(`  ${u.email} (${u.name})`);
    }
    
    await prisma?.$disconnect();
}

// We don't need prisma for this
const prisma = undefined;

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
