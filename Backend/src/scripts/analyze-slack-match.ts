import 'dotenv/config';
import { SlackAdapter } from '@/shared/slack/adapter.js';
import { prisma } from '@/shared/prisma.js';

async function main() {
    const adapter = new SlackAdapter();
    const allSlackUsers = await adapter.getAllUsers();

    const slackByEmail = new Map<string, { id: string; name: string; avatar?: string }>();
    for (const su of allSlackUsers) {
        if (su.deleted || su.is_bot) continue;
        const email = su.profile?.email?.toLowerCase();
        if (email) slackByEmail.set(email, { id: su.id, name: su.name, avatar: su.profile?.image_192 });
    }
    console.log('Active Slack users with email:', slackByEmail.size);

    const dbUsers = await prisma.user.findMany({
        select: { id: true, email: true, personalEmail: true, name: true, slackId: true },
    });
    console.log('DB users:', dbUsers.length);

    let matchedByPrimary = 0;
    let matchedByPersonal = 0;
    let notMatched = 0;

    for (const user of dbUsers) {
        const primaryMatch = slackByEmail.get(user.email.toLowerCase());
        const personalMatch = user.personalEmail ? slackByEmail.get(user.personalEmail.toLowerCase()) : null;

        if (primaryMatch) {
            matchedByPrimary++;
        } else if (personalMatch) {
            matchedByPersonal++;
        } else {
            notMatched++;
        }
    }

    console.log('---');
    console.log('Matched by primary email:', matchedByPrimary);
    console.log('Matched by personalEmail:', matchedByPersonal);
    console.log('Total matchable:', matchedByPrimary + matchedByPersonal);
    console.log('Not matched:', notMatched);

    // Update: link personalEmail matches, skip if slackId already taken
    let updated = 0;
    const usedSlackIds = new Set(dbUsers.filter(u => u.slackId).map(u => u.slackId));
    for (const user of dbUsers) {
        if (user.slackId) continue;
        const personalMatch = user.personalEmail ? slackByEmail.get(user.personalEmail.toLowerCase()) : null;
        if (personalMatch && !usedSlackIds.has(personalMatch.id)) {
            await prisma.user.update({
                where: { id: user.id },
                data: { slackId: personalMatch.id, avatarUrl: personalMatch.avatar || undefined },
            });
            usedSlackIds.add(personalMatch.id);
            updated++;
        }
    }
    console.log(`\nUpdated ${updated} users with Slack from personalEmail`);

    const finalSlack = await prisma.user.count({ where: { slackId: { not: null } } });
    console.log(`Total with slackId: ${finalSlack}/${dbUsers.length}`);

    await prisma.$disconnect();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
