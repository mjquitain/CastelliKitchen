import { Notification } from "../models/notification.model.js";

export const createNotification = async (userId, type, message, relatedId = null, relatedName = null) => {
    try {
        await Notification.create({
            userId,
            type,
            message,
            relatedId,
            relatedName
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

export const getNotificationMessage = (type, name) => {
    const messages = {
        ingredient_expired: `${name} has expired`,
        ingredient_expiring: `${name} is expiring soon`,
        ingredient_deleted: `${name} was deleted`,
        ingredient_used: `${name} was marked as used`,
        ingredient_edited: `${name} was updated`,
        ingredient_added: `${name} was added to your pantry`,
        recipe_added: `${name} was added to your recipes`,
        recipe_saved: `${name} was saved`,
        recipe_favorited: `${name} was added to favorites`,
        recipe_unfavorited: `${name} was removed from favorites and moved to saved recipes`,
        recipe_updated: `${name} was updated`
    };

    return messages[type] || 'New notification';
};
