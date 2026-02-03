import { Notification } from "../models/notification.model.js";

// Get all notifications
const getNotifications = async (req, res) => {
    try {
        const { limit = 50, unreadOnly } = req.query;

        const query = { userId: req.user.id };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Error fetching notifications.", error });
    }
};

// Create new notification
const createNotification = async (req, res) => {
    try {
        const { type, message, relatedId, relatedName } = req.body;

        const notification = await Notification.create({
            userId: req.user.id,
            type,
            message,
            relatedId,
            relatedName
        });

        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ message: "Error creating notification.", error });
    }
};

// Mark as read
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found." });
        }

        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ message: "Error marking notification as read.", error });
    }
};

// Mark as read all notifications 
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { isRead: true }
        );

        res.status(200).json({ message: "All notifications marked as read." });
    } catch (error) {
        res.status(500).json({ message: "Error marking all notifications as read.", error });
    }
};

// Delete
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found." });
        }

        res.status(200).json({ message: "Notification deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting notification.", error });
    }
};

// Clear all
const clearAllNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({ userId: req.user.id });

        res.status(200).json({ message: "All notifications cleared successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error clearing notifications.", error });
    }
};

// Get unread count
const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            userId: req.user.id,
            isRead: false
        });

        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ message: "Error fetching unread count.", error });
    }
};

export {
    clearAllNotifications, createNotification, deleteNotification, getNotifications, getUnreadCount, markAllAsRead, markAsRead
};

