import { describe, it, expect, beforeEach, jest, afterEach } from "@jest/globals";

jest.unstable_mockModule('../../src/models/notification.model.js', () => ({
  Notification: {
    create: jest.fn()
  }
}));

const { Notification } = await import('../../src/models/notification.model.js');
const { createNotification, getNotificationMessage } = await import('../../src/utils/notificationHelper.js');


describe('Notification Helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create notification successfully', async () => {
      Notification.create.mockResolvedValueOnce({
        id: 1,
        userId: 'user123',
        type: 'ingredient_added',
        message: 'Flour was added to your pantry'
      });

      await createNotification(
        'user123',
        'ingredient_added',
        'Flour was added to your pantry'
      );

      expect(Notification.create).toHaveBeenCalledWith({
        userId: 'user123',
        type: 'ingredient_added',
        message: 'Flour was added to your pantry',
        relatedId: null,
        relatedName: null
      });
    });

    it('should create notification with relatedId and relatedName', async () => {
      Notification.create.mockResolvedValueOnce({});

      await createNotification(
        'user123',
        'recipe_added',
        'Recipe added',
        'recipe456',
        'Chicken Curry'
      );

      expect(Notification.create).toHaveBeenCalledWith({
        userId: 'user123',
        type: 'recipe_added',
        message: 'Recipe added',
        relatedId: 'recipe456',
        relatedName: 'Chicken Curry'
      });
    });

    it('should log error but not throw when creation fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      Notification.create.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        createNotification('user123', 'ingredient_added', 'Test message')
      ).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating notification:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getNotificationMessage', () => {
    it.each([
      ['ingredient_expired', 'Milk', 'Milk has expired'],
      ['ingredient_expiring', 'Eggs', 'Eggs is expiring soon'],
      ['ingredient_deleted', 'Flour', 'Flour was deleted'],
      ['ingredient_used', 'Sugar', 'Sugar was marked as used'],
      ['ingredient_edited', 'Salt', 'Salt was updated'],
      ['ingredient_added', 'Rice', 'Rice was added to your pantry'],
      ['recipe_added', 'Chicken Curry', 'Chicken Curry was added to your recipes'],
      ['recipe_saved', 'Pasta', 'Pasta was saved'],
      ['recipe_favorited', 'Pizza', 'Pizza was added to favorites'],
      [
        'recipe_unfavorited',
        'Burger',
        'Burger was removed from favorites and moved to saved recipes'
      ],
      ['recipe_updated', 'Salad', 'Salad was updated']
    ])(
      'should return correct message for type: %s',
      (type, name, expected) => {
        const result = getNotificationMessage(type, name);
        expect(result).toBe(expected);
      }
    );

    it('should return default message for unknown type', () => {
      const result = getNotificationMessage('unknown_type', 'Test Item');
      expect(result).toBe('New notification');
    });

    it('should handle null/undefined name gracefully', () => {
      const result = getNotificationMessage('ingredient_added', null);
      expect(result).toBe('null was added to your pantry');
    });
  });
});