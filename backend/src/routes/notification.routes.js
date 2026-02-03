import express from 'express';
import {
    clearAllNotifications,
    createNotification,
    deleteNotification,
    getNotifications,
    getUnreadCount,
    markAllAsRead,
    markAsRead
} from '../controllers/notification.controller.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/', createNotification);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.delete('/', clearAllNotifications);

export default router;
