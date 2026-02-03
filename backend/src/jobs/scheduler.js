import cron from 'node-cron';
import { checkExpiringIngredients } from './checkExpiringIngredients.js';

export const initializeScheduler = () => {
    console.log('[Scheduler] Initializing scheduled jobs...');

    cron.schedule('0 8 * * *', async () => {
        console.log('[Scheduler] Running daily ingredient expiry check at 8:00 AM');
        await checkExpiringIngredients();
    }, {
        timezone: "Asia/Manila"
    });

    // checkExpiringIngredients();

    console.log('[Scheduler] Scheduled jobs initialized successfully');
};
