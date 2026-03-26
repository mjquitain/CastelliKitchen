import { describe, it, expect, beforeEach, jest } from "@jest/globals";

jest.unstable_mockModule('../../src/models/recipe.model.js', () => ({
  Recipe: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn()
  }
}));

jest.unstable_mockModule('../../src/config/firebase.js', () => {
  const mockFile = {
    save: jest.fn(),
    makePublic: jest.fn(),
    name: 'mock-file-name'
  };

  return {
    bucket: {
      name: 'test-bucket',
      file: jest.fn(() => mockFile)
    }
  };
});

jest.unstable_mockModule('../../src/utils/fileUpload.js', () => ({
  uploadFileToStorage: jest.fn(),
  deleteFileFromStorage: jest.fn()
}));

const { Recipe } = await import('../../src/models/recipe.model.js');
const { bucket } = await import('../../src/config/firebase.js');
const {
  uploadFileToStorage,
  deleteFileFromStorage
} = await import('../../src/utils/fileUpload.js');

const {
  addRecipe,
  getRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe
} = await import('../../src/controllers/recipe.controller.js');

describe('Recipe Controller', () => {
  let req;
  let res;
  let mockFile;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: { id: 'user123' },
      body: {},
      params: {},
      file: null
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };

    mockFile = bucket.file();

    mockFile.save.mockResolvedValue();
    mockFile.makePublic.mockResolvedValue();
  });

  describe('addRecipe', () => {
    it('should create recipe without image', async () => {
      req.body = { title: 'Test Recipe' };

      Recipe.create.mockResolvedValue({ id: '1' });

      await addRecipe(req, res);

      expect(Recipe.create).toHaveBeenCalledWith({
        title: 'Test Recipe',
        owner: 'user123'
      });

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should upload image and create recipe', async () => {
      req.file = {
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg'
      };

      req.body = { title: 'With Image' };

      Recipe.create.mockResolvedValue({ id: '1' });

      await addRecipe(req, res);

      expect(bucket.file).toHaveBeenCalled();
      expect(mockFile.save).toHaveBeenCalled();
      expect(mockFile.makePublic).toHaveBeenCalled();

      expect(Recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'user123',
          imageUrl: expect.stringContaining('https://storage.googleapis.com')
        })
      );
    });

    it('should handle upload error', async () => {
      req.file = { buffer: Buffer.from(''), mimetype: 'image/jpeg' };

      mockFile.save.mockRejectedValue(new Error('Upload failed'));

      await addRecipe(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle DB error', async () => {
      Recipe.create.mockRejectedValue(new Error('DB error'));

      await addRecipe(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getRecipes', () => {
    it('should return all recipes', async () => {
      Recipe.find.mockResolvedValue([{ id: 1 }]);

      await getRecipes(req, res);

      expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
    });

    it('should handle empty array', async () => {
      Recipe.find.mockResolvedValue([]);

      await getRecipes(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('getRecipeById', () => {
    it('should return recipe', async () => {
      req.params.id = '1';

      Recipe.findById.mockResolvedValue({ id: '1' });

      await getRecipeById(req, res);

      expect(res.json).toHaveBeenCalledWith({ id: '1' });
    });

    it('should return 404 if not found', async () => {
      req.params.id = '1';

      Recipe.findById.mockResolvedValue(null);

      await getRecipeById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateRecipe', () => {
    it('should update recipe without new image', async () => {
      req.params.id = '1';
      req.body = { title: 'Updated' };

      Recipe.findByIdAndUpdate.mockResolvedValue({ id: '1' });

      await updateRecipe(req, res);

      expect(res.json).toHaveBeenCalledWith({ id: '1' });
    });

    it('should update with new image and delete old one', async () => {
      req.params.id = '1';
      req.file = { buffer: Buffer.from(''), mimetype: 'image/jpeg' };

      Recipe.findById.mockResolvedValue({
        imageUrl: 'https://storage.googleapis.com/test-bucket/old.jpg'
      });

      uploadFileToStorage.mockResolvedValue('new-url');

      Recipe.findByIdAndUpdate.mockResolvedValue({ id: '1' });

      await updateRecipe(req, res);

      expect(uploadFileToStorage).toHaveBeenCalled();
      expect(deleteFileFromStorage).toHaveBeenCalled();
    });

    it('should not delete old image if not from storage', async () => {
      req.params.id = '1';
      req.file = { buffer: Buffer.from(''), mimetype: 'image/jpeg' };

      Recipe.findById.mockResolvedValue({
        imageUrl: 'https://example.com/image.jpg'
      });

      uploadFileToStorage.mockResolvedValue('new-url');
      Recipe.findByIdAndUpdate.mockResolvedValue({});

      await updateRecipe(req, res);

      expect(deleteFileFromStorage).not.toHaveBeenCalled();
    });

    it('should handle delete failure gracefully', async () => {
      req.params.id = '1';
      req.file = { buffer: Buffer.from(''), mimetype: 'image/jpeg' };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      Recipe.findById.mockResolvedValue({
        imageUrl: 'https://storage.googleapis.com/test-bucket/old.jpg'
      });

      uploadFileToStorage.mockResolvedValue('new-url');
      deleteFileFromStorage.mockRejectedValue(new Error('Delete failed'));
      Recipe.findByIdAndUpdate.mockResolvedValue({});

      await updateRecipe(req, res);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return 404 if recipe not found', async () => {
      req.params.id = '1';

      Recipe.findByIdAndUpdate.mockResolvedValue(null);

      await updateRecipe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle error', async () => {
      Recipe.findByIdAndUpdate.mockRejectedValue(new Error());

      await updateRecipe(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteRecipe', () => {
    it('should delete recipe', async () => {
      req.params.id = '1';

      Recipe.findOneAndDelete.mockResolvedValue({
        imageUrl: null
      });

      await deleteRecipe(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('should delete image if exists', async () => {
      req.params.id = '1';

      Recipe.findOneAndDelete.mockResolvedValue({
        imageUrl: 'https://storage.googleapis.com/test-bucket/img.jpg'
      });

      await deleteRecipe(req, res);

      expect(deleteFileFromStorage).toHaveBeenCalled();
    });

    it('should handle delete image failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      req.params.id = '1';

      Recipe.findOneAndDelete.mockResolvedValue({
        imageUrl: 'https://storage.googleapis.com/test-bucket/img.jpg'
      });

      deleteFileFromStorage.mockRejectedValue(new Error());

      await deleteRecipe(req, res);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return 404 if not found or unauthorized', async () => {
      Recipe.findOneAndDelete.mockResolvedValue(null);

      await deleteRecipe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle server error', async () => {
      Recipe.findOneAndDelete.mockRejectedValue(new Error());

      await deleteRecipe(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});