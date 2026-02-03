import { IngredientBatch } from "../models/ingredientbatch.model.js";
import { createNotification, getNotificationMessage } from "../utils/notificationHelper.js";

/**
 * Check for expired/expiring ingredients and create notifications
 */
export const checkExpiringIngredients = async () => {
    try {
        console.log('[Job] Checking for expired and expiring ingredients...');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);

        const batches = await IngredientBatch.find({
            isUsed: false,
            isDeleted: false
        }).populate('ingredientId');

        const expiredBatches = [];
        const expiringBatches = [];

        for (const batch of batches) {
            const expiryDate = new Date(batch.expiryDate);
            expiryDate.setHours(0, 0, 0, 0);

            if (expiryDate < today) {
                expiredBatches.push(batch);
            }
            else if (expiryDate >= today && expiryDate <= sevenDaysFromNow) {
                expiringBatches.push(batch);
            }
        }

        // Notifications for expired ingredients
        for (const batch of expiredBatches) {
            const existingNotification = await checkIfNotificationExists(
                batch.userId,
                'ingredient_expired',
                batch.ingredientId._id,
                today
            );

            if (!existingNotification) {
                await createNotification(
                    batch.userId,
                    'ingredient_expired',
                    getNotificationMessage('ingredient_expired', batch.ingredientId.name),
                    batch.ingredientId._id,
                    batch.ingredientId.name
                );
                console.log(`[Job] Created expired notification for: ${batch.ingredientId.name}`);
            }
        }

        // Notifications for expiring ingredients
        for (const batch of expiringBatches) {
            const existingNotification = await checkIfNotificationExists(
                batch.userId,
                'ingredient_expiring',
                batch.ingredientId._id,
                today
            );

            if (!existingNotification) {
                const MS_PER_DAY = 1000 * 60 * 60 * 24;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const expiryDate = new Date(batch.expiryDate);
                const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / MS_PER_DAY);
                const message = `${batch.ingredientId.name} is expiring in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`;

                await createNotification(
                    batch.userId,
                    'ingredient_expiring',
                    message,
                    batch.ingredientId._id,
                    batch.ingredientId.name
                );
                console.log(`[Job] Created expiring notification for: ${batch.ingredientId.name}`);
            }
        }

        console.log(`[Job] Completed: ${expiredBatches.length} expired, ${expiringBatches.length} expiring`);

    } catch (error) {
        console.error('[Job] Error checking expiring ingredients:', error);
    }
};

/**
 * Checker if a notification already exists
 */
const checkIfNotificationExists = async (userId, type, relatedId, today) => {
    const { Notification } = await import("../models/notification.model.js");

    const startOfDay = new Date(today);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const existingNotification = await Notification.findOne({
        userId,
        type,
        relatedId,
        createdAt: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    });

    return existingNotification;
};
