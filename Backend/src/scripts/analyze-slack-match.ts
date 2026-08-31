import 'dotenv/config';
import { SlackAdapter } from '@/shared/slack/adapter.js';
import { prisma } from '@/shared/prisma.js';

async function main() {
    const adapter = new SlackAdapter();
    const allSlackUsers = await adapter.getAllUsers();

    const slackByEmail = new Map<string, { id: string; name: string; avatars: { image_24?: string; image_32?: string; image_48?: string; image_72?: string; image_192?: string; image_512?: string } }>();
    for (const su of allSlackUsers) {
        if (su.deleted || su.is_bot) continue;
        const email = su.profile?.email?.toLowerCase();
        if (email) slackByEmail.set(email, {
            id: su.id,
            name: su.name,
            avatars: {
                image_24: su.profile?.image_24,
                image_32: su.profile?.image_32,
                image_48: su.profile?.image_48,
                image_72: su.profile?.image_72,
                image_192: su.profile?.image_192,
                image_512: su.profile?.image_512,
            },
        });
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
                data: {
                    slackId: personalMatch.id,
                    avatarUrl24: personalMatch.avatars.image_24,
                    avatarUrl32: personalMatch.avatars.image_32,
                    avatarUrl48: personalMatch.avatars.image_48,
                    avatarUrl72: personalMatch.avatars.image_72,
                    avatarUrl192: personalMatch.avatars.image_192,
                    avatarUrl512: personalMatch.avatars.image_512,
                },
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
