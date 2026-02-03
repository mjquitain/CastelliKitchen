import api from "@/lib/api";

export interface Notification {
    _id: string;
    userId: string;
    type: 'ingredient_expired' | 'ingredient_expiring' | 'ingredient_deleted' |
    'ingredient_used' | 'ingredient_edited' | 'ingredient_added' |
    'recipe_added' | 'recipe_saved' | 'recipe_favorited';
    message: string;
    relatedId?: string;
    relatedName?: string;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

export const notificationApi = {
    // Get all
    getAll: (unreadOnly = false) =>
        api.get<Notification[]>(`/notifications${unreadOnly ? '?unreadOnly=true' : ''}`),

    // Get unread count
    getUnreadCount: () =>
        api.get<{ count: number }>('/notifications/unread-count'),

    // Create a notification
    create: (data: { type: string; message: string; relatedId?: string; relatedName?: string }) =>
        api.post<Notification>('/notifications', data),

    // Mark as read
    markAsRead: (id: string) =>
        api.patch<Notification>(`/notifications/${id}/read`),

    // Mark all as read
    markAllAsRead: () =>
        api.patch('/notifications/read-all'),

    // Delete
    delete: (id: string) =>
        api.delete(`/notifications/${id}`),

    // Clear all
    clearAll: () =>
        api.delete('/notifications')
};
