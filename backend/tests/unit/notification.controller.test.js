import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount
} from '../../src/controllers/notification.controller.js';

import { Notification } from '../../src/models/notification.model.js';

vi.mock('../../src/models/notification.model.js', () => ({
  Notification: {
    find: vi.fn(),
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateMany: vi.fn(),
    findOneAndDelete: vi.fn(),
    deleteMany: vi.fn(),
    countDocuments: vi.fn()
  }
}));

describe('Notification Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { id: 'user123' },
      query: {},
      body: {},
      params: {}
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
  });

  describe('getNotifications', () => {
    it('should fetch notifications with default limit', async () => {
      const mockChain = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(['notif1'])
      };

      Notification.find.mockReturnValue(mockChain);

      await getNotifications(req, res);

      expect(Notification.find).toHaveBeenCalledWith({
        userId: 'user123'
      });

      expect(mockChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockChain.limit).toHaveBeenCalledWith(50);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(['notif1']);
    });

    it('should filter unread notifications', async () => {
      req.query.unreadOnly = 'true';

      const mockChain = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([])
      };

      Notification.find.mockReturnValue(mockChain);

      await getNotifications(req, res);

      expect(Notification.find).toHaveBeenCalledWith({
        userId: 'user123',
        isRead: false
      });
    });

    it('should handle custom limit', async () => {
      req.query.limit = '10';

      const mockChain = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([])
      };

      Notification.find.mockReturnValue(mockChain);

      await getNotifications(req, res);

      expect(mockChain.limit).toHaveBeenCalledWith(10);
    });

    it('should handle invalid limit (NaN)', async () => {
      req.query.limit = 'invalid';

      const mockChain = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([])
      };

      Notification.find.mockReturnValue(mockChain);

      await getNotifications(req, res);

      expect(mockChain.limit).toHaveBeenCalledWith(NaN);
    });

    it('should return 500 on error', async () => {
      Notification.find.mockImplementation(() => {
        throw new Error('DB error');
      });

      await getNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createNotification', () => {
    it('should create notification', async () => {
      req.body = {
        type: 'like',
        message: 'New like',
        relatedId: '123',
        relatedName: 'Post'
      };

      Notification.create.mockResolvedValue({ id: 'notif1' });

      await createNotification(req, res);

      expect(Notification.create).toHaveBeenCalledWith({
        userId: 'user123',
        ...req.body
      });

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle missing fields', async () => {
      req.body = {};

      Notification.create.mockResolvedValue({});

      await createNotification(req, res);

      expect(Notification.create).toHaveBeenCalledWith({
        userId: 'user123',
        type: undefined,
        message: undefined,
        relatedId: undefined,
        relatedName: undefined
      });
    });

    it('should return 500 on error', async () => {
      Notification.create.mockRejectedValue(new Error('DB error'));

      await createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      req.params.id = 'notif1';

      Notification.findOneAndUpdate.mockResolvedValue({ id: 'notif1' });

      await markAsRead(req, res);

      expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'notif1', userId: 'user123' },
        { isRead: true },
        { new: true }
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if notification not found', async () => {
      Notification.findOneAndUpdate.mockResolvedValue(null);

      await markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      Notification.findOneAndUpdate.mockRejectedValue(new Error());

      await markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all as read', async () => {
      await markAllAsRead(req, res);

      expect(Notification.updateMany).toHaveBeenCalledWith(
        { userId: 'user123', isRead: false },
        { isRead: true }
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle error', async () => {
      Notification.updateMany.mockRejectedValue(new Error());

      await markAllAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      req.params.id = 'notif1';

      Notification.findOneAndDelete.mockResolvedValue({ id: 'notif1' });

      await deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      Notification.findOneAndDelete.mockResolvedValue(null);

      await deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      Notification.findOneAndDelete.mockRejectedValue(new Error());

      await deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('clearAllNotifications', () => {
    it('should delete all notifications', async () => {
      await clearAllNotifications(req, res);

      expect(Notification.deleteMany).toHaveBeenCalledWith({
        userId: 'user123'
      });

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle error', async () => {
      Notification.deleteMany.mockRejectedValue(new Error());

      await clearAllNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      Notification.countDocuments.mockResolvedValue(5);

      await getUnreadCount(req, res);

      expect(Notification.countDocuments).toHaveBeenCalledWith({
        userId: 'user123',
        isRead: false
      });

      expect(res.json).toHaveBeenCalledWith({ count: 5 });
    });

    it('should handle zero count', async () => {
      Notification.countDocuments.mockResolvedValue(0);

      await getUnreadCount(req, res);

      expect(res.json).toHaveBeenCalledWith({ count: 0 });
    });

    it('should handle error', async () => {
      Notification.countDocuments.mockRejectedValue(new Error());

      await getUnreadCount(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});