import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveRecipe, getSavedRecipes, getFavoriteRecipes, toggleFavoriteStatus, deleteSavedRecipe, updateSavedRecipe } from '../../src/controllers/savedrecipes.controller.js';
import { SavedRecipe } from '../../src/models/savedrecipe.model.js';
import { uploadFileToStorage, deleteFileFromStorage } from '../../src/utils/fileUpload.js';
import { createNotification, getNotificationMessage } from '../../src/utils/notificationHelper.js';

vi.mock('../../src/models/savedrecipe.model.js', () => ({
  SavedRecipe: {
    findOne: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
    findOneAndDelete: vi.fn()
  }
}));

vi.mock('../../src/utils/fileUpload.js', () => ({
  uploadFileToStorage: vi.fn(),
  deleteFileFromStorage: vi.fn()
}));

vi.mock('../../src/utils/notificationHelper.js', () => ({
  createNotification: vi.fn(),
  getNotificationMessage: vi.fn((type, title) => `${title} message`)
}));

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SavedRecipe Controller', () => {

  describe('saveRecipe', () => {
    const reqBase = {
      user: { id: 'user123' },
      body: {
        apiRecipeId: 'recipe1',
        title: 'Pizza',
        category: 'Italian',
        isFavorite: true,
        ingredients: [{ name: 'Cheese', amount: '100g' }]
      }
    };

    it('saves a new recipe successfully without file', async () => {
      const req = { ...reqBase };
      SavedRecipe.findOne.mockResolvedValue(null);
      SavedRecipe.create.mockResolvedValue({ ...req.body, _id: 'id123', userId: req.user.id });

      const res = mockRes();
      await saveRecipe(req, res);

      expect(SavedRecipe.findOne).toHaveBeenCalledWith({ apiRecipeId: req.body.apiRecipeId, userId: req.user.id });
      expect(SavedRecipe.create).toHaveBeenCalled();
      expect(createNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('parses ingredients from JSON string', async () => {
      const req = { ...reqBase, body: { ...reqBase.body, ingredients: JSON.stringify(reqBase.body.ingredients) } };
      SavedRecipe.findOne.mockResolvedValue(null);
      SavedRecipe.create.mockResolvedValue({ ...req.body, _id: 'id123', userId: req.user.id });

      const res = mockRes();
      await saveRecipe(req, res);

      expect(SavedRecipe.create).toHaveBeenCalledWith(expect.objectContaining({
        ingredients: reqBase.body.ingredients
      }));
    });

    it('returns 400 if ingredients is invalid JSON', async () => {
      const req = { ...reqBase, body: { ...reqBase.body, ingredients: '{badjson}' } };
      const res = mockRes();

      await saveRecipe(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid ingredients format" });
    });

    it('uploads file if req.file exists', async () => {
      const req = { ...reqBase, file: { buffer: Buffer.from('data') } };
      SavedRecipe.findOne.mockResolvedValue(null);
      uploadFileToStorage.mockResolvedValue('fileurl');
      SavedRecipe.create.mockResolvedValue({ ...req.body, image: 'fileurl', _id: 'id123', userId: req.user.id });

      const res = mockRes();
      await saveRecipe(req, res);

      expect(uploadFileToStorage).toHaveBeenCalledWith(req.file, `recipes/${req.user.id}`);
      expect(SavedRecipe.create).toHaveBeenCalledWith(expect.objectContaining({ image: 'fileurl' }));
    });

    it('returns 409 if recipe already saved', async () => {
      const req = { ...reqBase };
      SavedRecipe.findOne.mockResolvedValue({ _id: 'existingId' });

      const res = mockRes();
      await saveRecipe(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ recipe: { _id: 'existingId' } }));
    });
  });

  describe('getSavedRecipes', () => {
    it('returns saved recipes sorted', async () => {
      const req = { user: { id: 'user1' } };
      const mockData = [{ title: 'A' }, { title: 'B' }];
      SavedRecipe.find.mockReturnValue({ sort: vi.fn().mockResolvedValue(mockData) });

      const res = mockRes();
      await getSavedRecipes(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it('returns 500 on DB error', async () => {
      const req = { user: { id: 'user1' } };
      SavedRecipe.find.mockImplementation(() => { throw new Error('DB fail'); });

      const res = mockRes();
      await getSavedRecipes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getFavoriteRecipes', () => {
    it('returns only favorite recipes', async () => {
      const req = { user: { id: 'user1' } };
      const mockFav = [{ title: 'Fav1', isFavorite: true }];
      SavedRecipe.find.mockResolvedValue(mockFav);

      const res = mockRes();
      await getFavoriteRecipes(req, res);

      expect(SavedRecipe.find).toHaveBeenCalledWith({ userId: 'user1', isFavorite: true });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockFav);
    });
  });

  describe('toggleFavoriteStatus', () => {
    it('toggles favorite from false → true and creates notification', async () => {
      const req = { params: { id: 'id1' }, user: { id: 'user1' } };
      const mockRecipe = { _id: 'id1', isFavorite: false, title: 'T', save: vi.fn() };
      SavedRecipe.findOne.mockResolvedValue(mockRecipe);

      const res = mockRes();
      await toggleFavoriteStatus(req, res);

      expect(mockRecipe.isFavorite).toBe(true);
      expect(createNotification).toHaveBeenCalledWith('user1', 'recipe_favorited', 'T message', 'id1', 'T');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 404 if recipe not found', async () => {
      const req = { params: { id: 'id1' }, user: { id: 'user1' } };
      SavedRecipe.findOne.mockResolvedValue(null);

      const res = mockRes();
      await toggleFavoriteStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteSavedRecipe', () => {
    it('deletes recipe with image', async () => {
      const req = { params: { id: 'id1' }, user: { id: 'user1' } };
      const mockRecipe = { _id: 'id1', image: 'https://storage.googleapis.com/file.jpg' };
      SavedRecipe.findOneAndDelete.mockResolvedValue(mockRecipe);

      const res = mockRes();
      await deleteSavedRecipe(req, res);

      expect(deleteFileFromStorage).toHaveBeenCalledWith(mockRecipe.image);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 404 if recipe not found', async () => {
      const req = { params: { id: 'id1' }, user: { id: 'user1' } };
      SavedRecipe.findOneAndDelete.mockResolvedValue(null);

      const res = mockRes();
      await deleteSavedRecipe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateSavedRecipe', () => {
    it('updates recipe fields and creates notification', async () => {
      const req = {
        params: { id: 'id1' },
        user: { id: 'user1' },
        body: { title: 'New Title', ingredients: [{ name: 'X' }] }
      };
      const mockRecipe = { _id: 'id1', save: vi.fn(), title: 'Old', ingredients: [], image: null };
      SavedRecipe.findOne.mockResolvedValue(mockRecipe);

      const res = mockRes();
      await updateSavedRecipe(req, res);

      expect(mockRecipe.title).toBe('New Title');
      expect(mockRecipe.ingredients).toEqual([{ name: 'X' }]);
      expect(createNotification).toHaveBeenCalledWith('user1', 'recipe_updated', 'New Title message', 'id1', 'New Title');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 404 if recipe not found', async () => {
      const req = { params: { id: 'id1' }, user: { id: 'user1' }, body: {} };
      SavedRecipe.findOne.mockResolvedValue(null);

      const res = mockRes();
      await updateSavedRecipe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 for invalid ingredients JSON', async () => {
      const req = { params: { id: 'id1' }, user: { id: 'user1' }, body: { ingredients: '{badjson}' } };
      const res = mockRes();

      await updateSavedRecipe(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});