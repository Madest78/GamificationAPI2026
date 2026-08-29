import 'dotenv/config';
import { readFileSync } from 'fs';
import { SlackAdapter } from '@/shared/slack/adapter.js';
import { prisma } from '@/shared/prisma.js';

async function main() {
    const adapter = new SlackAdapter();
    const allSlackUsers = await adapter.getAllUsers();

    const slackByEmail = new Map<string, { id: string; avatar?: string; realName?: string }>();
    for (const su of allSlackUsers) {
        if (su.deleted || su.is_bot) continue;
        const email = su.profile?.email?.toLowerCase();
        if (email) slackByEmail.set(email, { id: su.id, avatar: su.profile?.image_192, realName: su.profile?.real_name });
    }

    const dbUsers = await prisma.user.findMany({
        select: { id: true, email: true, personalEmail: true, slackId: true },
    });

    // Build lookup maps
    const primaryEmailToUser = new Map<string, string>();
    const personalEmailToUser = new Map<string, string>();
    for (const u of dbUsers) {
        primaryEmailToUser.set(u.email.toLowerCase(), u.id);
        if (u.personalEmail) personalEmailToUser.set(u.personalEmail.toLowerCase(), u.id);
    }

    // Categorize unmatched Slack users
    let foundByPrimary = 0, foundByPersonal = 0, notInDB = 0;
    const notInDBList: Array<{ email: string; name: string }> = [];

    for (const [email, slack] of slackByEmail) {
        if (primaryEmailToUser.has(email)) {
            foundByPrimary++;
        } else if (personalEmailToUser.has(email)) {
            foundByPersonal++;
        } else {
            notInDB++;
            notInDBList.push({ email, name: slack.realName || '' });
        }
    }

    console.log('=== SLACK MATCH ANALYSIS ===');
    console.log(`Total Slack users: ${slackByEmail.size}`);
    console.log(`Found by primary email: ${foundByPrimary}`);
    console.log(`Found by personalEmail: ${foundByPersonal}`);
    console.log(`NOT in DB at all: ${notInDB}`);
    console.log(`\nTotal matchable: ${foundByPrimary + foundByPersonal}`);

    // Check: how many of the "not in DB" are actually in Emplanner CSV?
    const csvContent = readFileSync('./corporate-emails-all.csv', 'utf-8');
    const csvLines = csvContent.trim().split('\n').slice(1);
    const emplannerEmails = new Set<string>();
    for (const line of csvLines) {
        const [, corpEmail, email] = line.split('|');
        if (email) emplannerEmails.add(email.toLowerCase().trim());
        if (corpEmail) emplannerEmails.add(corpEmail.toLowerCase().trim());
    }

    let inEmplannerNotInDB = 0;
    const inEmplannerNotInDBList: Array<{ email: string; name: string }> = [];
    for (const u of notInDBList) {
        if (emplannerEmails.has(u.email)) {
            inEmplannerNotInDB++;
            inEmplannerNotInDBList.push(u);
        }
    }

    console.log(`\nOf ${notInDB} not in DB:`);
    console.log(`  In Emplanner CSV: ${inEmplannerNotInDB}`);
    console.log(`  Truly external: ${notInDB - inEmplannerNotInDB}`);

    console.log(`\nFirst 20 "in Emplanner but not in DB" Slack users:`);
    for (const u of inEmplannerNotInDBList.slice(0, 20)) {
        console.log(`  ${u.email} (${u.name})`);
    }

    await prisma.$disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
