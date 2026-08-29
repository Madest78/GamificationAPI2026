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

    // All emails from DB (primary + personal)
    const allDbEmails = new Map<string, { userId: string; field: string }>();
    for (const u of dbUsers) {
        allDbEmails.set(u.email.toLowerCase(), { userId: u.id, field: 'email' });
        if (u.personalEmail) allDbEmails.set(u.personalEmail.toLowerCase(), { userId: u.id, field: 'personalEmail' });
    }

    // Match Slack users to DB users
    let matched = 0, notMatched = 0;
    const notMatchedList: Array<{ slackEmail: string; name: string }> = [];

    for (const [email, slack] of slackByEmail) {
        if (allDbEmails.has(email)) {
            matched++;
        } else {
            notMatched++;
            notMatchedList.push({ slackEmail: email, name: slack.realName || '' });
        }
    }

    console.log(`Slack users: ${slackByEmail.size}`);
    console.log(`Matched to DB: ${matched}`);
    console.log(`NOT matched: ${notMatched}`);

    // Check: how many DB users have no personalEmail?
    const noPersonalEmail = dbUsers.filter(u => !u.personalEmail).length;
    const noSlack = dbUsers.filter(u => !u.slackId).length;
    console.log(`\nDB users without personalEmail: ${noPersonalEmail}`);
    console.log(`DB users without slackId: ${noSlack}`);

    // Show unmatched Slack users
    console.log(`\nFirst 30 unmatched Slack users:`);
    for (const u of notMatchedList.slice(0, 30)) {
        console.log(`  ${u.slackEmail} (${u.name})`);
    }

    await prisma.$disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
