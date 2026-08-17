import cron, { ScheduledTask } from 'node-cron';
import { getQueue } from './queue.js';

interface JobDefinition {
    name: string;
    schedule: string;
    queue: string;
    data?: Record<string, unknown>;
}

const jobs: JobDefinition[] = [
    {
        name: 'import.daily',
        schedule: '0 2 * * *',
        queue: 'import-daily',
    },
    {
        name: 'achievements.check',
        schedule: '0 3 * * *',
        queue: 'achievements-check',
    },
    {
        name: 'kudos.reset',
        schedule: '0 0 * * 1',
        queue: 'kudos-reset',
    },
];

const scheduledTasks: ScheduledTask[] = [];

export async function startScheduler(): Promise<void> {
    const boss = await getQueue();

    for (const job of jobs) {
        await boss.createQueue(job.queue);

        const task = cron.schedule(job.schedule, async () => {
            console.log(`[Scheduler] Running job: ${job.name}`);
            try {
                await boss.send(job.queue, job.data || {});
                console.log(`[Scheduler] Job ${job.name} queued successfully`);
            } catch (error) {
                console.error(`[Scheduler] Failed to queue job ${job.name}:`, error);
            }
        });

        scheduledTasks.push(task);
        console.log(`[Scheduler] Registered job: ${job.name} (${job.schedule})`);
    }
}

export async function stopScheduler(): Promise<void> {
    console.log('[Scheduler] Stopping scheduler...');
    for (const task of scheduledTasks) {
        task.stop();
    }
    scheduledTasks.length = 0;
    console.log('[Scheduler] Scheduler stopped');
}
