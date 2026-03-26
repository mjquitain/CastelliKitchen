import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { filterByIngredient, searchByName, lookupById } from '../../src/controllers/mealdb.controller.js'; 

global.fetch = jest.fn();

describe('Meal API Handlers', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      query: {},
      params: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn()
    };
  });

  describe('filterByIngredient', () => {
    it('should filter meals by ingredient successfully', async () => {
      const mockData = { meals: [{ idMeal: '1', strMeal: 'Chicken Curry' }] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      mockReq.query = { ingredient: 'chicken' };

      await filterByIngredient(mockReq, mockRes);

      expect(fetch).toHaveBeenCalledWith(
        'https://www.themealdb.com/api/json/v1/1/filter.php?i=chicken'
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockData);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle empty ingredient parameter', async () => {
      const mockData = { meals: [] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      mockReq.query = {};

      await filterByIngredient(mockReq, mockRes);

      expect(fetch).toHaveBeenCalledWith(
        'https://www.themealdb.com/api/json/v1/1/filter.php?i='
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockData);
    });

    it('should handle fetch errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      mockReq.query = { ingredient: 'chicken' };

      await filterByIngredient(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to fetch meals by ingredient'
      });
    });

    it('should encode special characters in ingredient', async () => {
      const mockData = { meals: [] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      mockReq.query = { ingredient: 'chicken & rice' };

      await filterByIngredient(mockReq, mockRes);

      expect(fetch).toHaveBeenCalledWith(
        'https://www.themealdb.com/api/json/v1/1/filter.php?i=chicken%20%26%20rice'
      );
    });
  });

  describe('searchByName', () => {
    it('should search meals by name successfully', async () => {
      const mockData = { meals: [{ idMeal: '1', strMeal: 'Chicken Curry' }] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      mockReq.query = { s: 'chicken' };

      await searchByName(mockReq, mockRes);

      expect(fetch).toHaveBeenCalledWith(
        'https://www.themealdb.com/api/json/v1/1/search.php?s=chicken'
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockData);
    });

    it('should handle empty search parameter (defaults to empty string)', async () => {
      const mockData = { meals: [] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      mockReq.query = {};

      await searchByName(mockReq, mockRes);

      expect(fetch).toHaveBeenCalledWith(
        'https://www.themealdb.com/api/json/v1/1/search.php?s='
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockData);
    });

    it('should handle fetch errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      mockReq.query = { s: 'chicken' };

      await searchByName(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to search meals'
      });
    });

    it('should encode special characters in search term', async () => {
      const mockData = { meals: [] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      mockReq.query = { s: 'chicken & rice' };

      await searchByName(mockReq, mockRes);

      expect(fetch).toHaveBeenCalledWith(
        'https://www.themealdb.com/api/json/v1/1/search.php?s=chicken%20%26%20rice'
      );
    });
  });

  describe('lookupById', () => {
    it('should lookup meal by ID successfully', async () => {
      const mockData = { meals: [{ idMeal: '52854', strMeal: 'Chicken Curry' }] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      mockReq.params = { id: '52854' };

      await lookupById(mockReq, mockRes);

      expect(fetch).toHaveBeenCalledWith(
        'https://www.themealdb.com/api/json/v1/1/lookup.php?i=52854'
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockData);
    });

    it('should handle fetch errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      mockReq.params = { id: '52854' };

      await lookupById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to fetch meal details'
      });
    });

    it('should handle missing ID parameter', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      mockReq.params = {};

      await lookupById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Error Logging', () => {
    beforeEach(() => {
      // Mock console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should log errors to console.error', async () => {
      const error = new Error('Test error');
      fetch.mockRejectedValueOnce(error);

      mockReq.query = { ingredient: 'chicken' };

      await filterByIngredient(mockReq, mockRes);

      expect(console.error).toHaveBeenCalledWith(
        'Error fetching meals by ingredient:',
        error
      );
    });
  });
});