import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addIngredient,
  getIngredients,
  getIngredientsByCategory,
  getBatchesPerIngredient,
  getIngredientBatch,
  updateIngredient,
  updateIngredientBatch,
  deleteIngredient,
  deleteIngredientBatch
} from "../../src/controllers/ingredient.controller.js";
import { Ingredient } from "../../src/models/ingredient.model.js";
import { IngredientBatch } from "../../src/models/ingredientbatch.model.js";
import { createNotification, getNotificationMessage } from "../../src/utils/notificationHelper.js";

vi.mock("../../src/models/ingredient.model.js", () => ({
  Ingredient: {
    findOne: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn()
  }
}));

vi.mock("../../src/models/ingredientbatch.model.js", () => ({
  IngredientBatch: {
    findOne: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
    deleteMany: vi.fn()
  }
}));

vi.mock("../../src/utils/notificationHelper.js", () => ({
  createNotification: vi.fn(),
  getNotificationMessage: vi.fn(() => "mock message")
}));

describe("Ingredient Controller", () => {

  let req, res;

  beforeEach(() => {
    req = {
      user: { id: "user123" },
      body: {
        name: "Tomato",
        quantity: "2",
        category: "Vegetable",
        dateAdded: "2026-01-01",
        expiryDate: "2026-01-10"
      },
      params: {}
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    vi.clearAllMocks();
  });

  describe("addIngredient", () => {
    it("should create ingredient and ingredient batch", async () => {

      Ingredient.findOne.mockResolvedValue(null);
      Ingredient.create.mockResolvedValue({ _id: "ing1", name: "tomato" });

      IngredientBatch.findOne.mockResolvedValue(null);
      IngredientBatch.create.mockResolvedValue({ _id: "batch1" });

      await addIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredient: expect.any(Object),
          ingredientBatch: expect.any(Object)
        })
      );

      expect(getNotificationMessage).toHaveBeenCalledWith("ingredient_added", "tomato");

      expect(createNotification).toHaveBeenCalledWith("user123", "ingredient_added", "mock message", "ing1", "tomato");
    });

    it("should return 409 if ingredient batch already exists", async () => {

      Ingredient.findOne.mockResolvedValue({ _id: "ing1" });
      IngredientBatch.findOne.mockResolvedValue({ _id: "batch1" });

      await addIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(409);

      expect(res.json).toHaveBeenCalledWith({ message: "Ingredient already saved. If there are any changes, update the record instead." })
    });

    it("should handle error with status code 500, error message, and notification", async () => {
      Ingredient.findOne.mockRejectedValue(new Error());

      await addIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      
      expect(res.json).toHaveBeenCalledWith({ message: "Error saving ingredient." });
    });

    it("should still succeed even if notification fails", async () => {
      Ingredient.findOne.mockResolvedValue(null);
      Ingredient.create.mockResolvedValue({ _id: "ing1", name: "tomato" });

      IngredientBatch.findOne.mockResolvedValue(null);
      IngredientBatch.create.mockResolvedValue({ _id: "batch1" });

      createNotification.mockRejectedValue(new Error());

      await addIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      
      expect(createNotification).toHaveBeenCalled();
    });
    it("should return 400 if required fields are missing", async () => {
      req.body = { name: "" };

      await addIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        message: expect.any(String)
      });
    });

    it("should treat ingredient names as case-insensitive duplicates", async () => {
      Ingredient.findOne.mockResolvedValue({ _id: "ing1", name: "tomato" });
      IngredientBatch.findOne.mockResolvedValue({ _id: "batch1" });

      await addIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("should return 400 for invalid date format", async () => {
      req.body = {
        name: "Tomato",
        quantity: "2",
        category: "Vegetable",
        dateAdded: "invalid-date",
        expiryDate: "invalid-date"
      };

      await addIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if expiryDate is before dateAdded", async () => {
      req.body = {
        name: "Tomato",
        quantity: "2",
        category: "Vegetable",
        dateAdded: "2026-01-10",
        expiryDate: "2026-01-01"
      };

      await addIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

  })

  describe("getIngredients", () => {
    it("should get ingredients", async () => {
      const mockIngredients = [
        { _id: "ing1", name: "tomato", batches: [] },
        { _id: "ing2", name: "carrot", batches: [] }
      ];
      Ingredient.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockIngredients)
      });

      await getIngredients(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith(mockIngredients);
    });

    it("should handle error with status code 500 and error message", async () => {

      Ingredient.find.mockReturnValue({
        populate: vi.fn().mockRejectedValue(new Error())
      });

      await getIngredients(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({ message: "Error retrieving ingredients." });
    });

    it("should return empty array if no ingredients found", async () => {
      Ingredient.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue([])
      });

      await getIngredients(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

  })

  describe("getIngredientsByCategory", () => {
    it("should get ingredients by category", async () => {
      const mockIngredients = [
        { _id: "ing1", name: "Milk", category: "Dairy", userId: "user123" },
        { _id: "ing2", name: "Butter", category: "Dairy", userId: "user123" },
      ];
      req.params.category = "Dairy";

      Ingredient.find.mockResolvedValue(mockIngredients);

      await getIngredientsByCategory(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);

      expect(Ingredient.find).toHaveBeenCalledWith({
        userId: req.user.id,
        category: "Dairy",
      });
    });

    it("should handle error with status code 500 and error message", async () => {
      req.params.category = "Dairy";
      Ingredient.find.mockRejectedValue(new Error());

      await getIngredientsByCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({ message: "Error retrieving ingredients by category." });
    });

    it("should return 400 if category param is missing", async () => {
      req.params.category = undefined;

      await getIngredientsByCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return empty array if no ingredients match category", async () => {
      req.params.category = "Dairy";

      Ingredient.find.mockResolvedValue([]);

      await getIngredientsByCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  })
  
  describe("getBatchesPerIngredient", () => {
    it("should get batches per ingredient", async () => {
      req.params.ingredientId = "ing1";

      const mockBatches = [
        { _id: "batch1", quantity: "2", expiryDate: "2026-01-10", isUsed: false, isDeleted: false },
        { _id: "batch2", quantity: "3", expiryDate: "2026-01-12", isUsed: false, isDeleted: false }
      ];

      IngredientBatch.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockBatches)
      });

      await getBatchesPerIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith(mockBatches);
    });

    it("should handle error with status code 500 and error message", async () => {
      req.params.ingredientId = "ing1";

      IngredientBatch.find.mockReturnValue({
        sort: vi.fn().mockRejectedValue(new Error())
      });

      await getBatchesPerIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({
        message: "Error retrieving all batches of the ingredient"
      });
    });

    it("should return empty array if no batches exist", async () => {
      req.params.ingredientId = "ing1";

      IngredientBatch.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue([])
      });

      await getBatchesPerIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  })
  

  describe("getIngredientBatch", () => {
    
    beforeEach(() => {
      req.params.batchId = "batch1";
    });

    it("should return batch", async () => {
      const mockBatch = {
        _id: "batch1",
        ingredientId: { _id: "ing1", name: "tomato" }
      };

      IngredientBatch.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockBatch)
      });

      await getIngredientBatch(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenLastCalledWith(mockBatch);
    });

    it("should return 404 if batch not found", async () => {
      IngredientBatch.findOne.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      });

      await getIngredientBatch(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled({ message: "Ingredient batch not found." })
    });

    it("should handle error with status code 500 and error message", async () => {
      IngredientBatch.findOne.mockReturnValue({
        populate: vi.fn().mockRejectedValue(new Error())
      });

      await getIngredientBatch(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({ message: "Error retrieving ingredient batch." });
    });

    it("should return 400 for invalid batchId", async () => {
      req.params.batchId = null;

      await getIngredientBatch(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  })

  describe("updateIngredient", () => {

    beforeEach(() =>  {
      req.params.ingredientId = "ing1";
      req.body = { name: "Tomato", category: "Vegetable" };
    });

    it("should update ingredient", async () => {
      const updatedIngredient = { _id: "ing1", name: "tomato", category: "Vegetable" };

      Ingredient.findOneAndUpdate.mockResolvedValue(updatedIngredient);

      await updateIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      expect(res.json).toHaveBeenCalledWith(updatedIngredient);
    });

    it("should return 404 if ingredient not found", async () => {
      Ingredient.findOneAndUpdate.mockResolvedValue(null);

      await updateIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({ message: "Ingredient not found." });
    });

    it("should create notification when ingredient is updated", async () => {
      const updatedIngredient = { _id: "ing1", name: "tomato" };

      Ingredient.findOneAndUpdate.mockResolvedValue(updatedIngredient);

      await updateIngredient(req, res);

      expect(getNotificationMessage).toHaveBeenCalledWith("ingredient_edited", "tomato");

      expect(createNotification).toHaveBeenCalledWith("user123", "ingredient_edited", "mock message", "ing1", "tomato");
    });

    it("should still succeed even if notification fails", async () => {
      const updatedIngredient = { _id: "ing1", name: "tomato" };

      Ingredient.findOneAndUpdate.mockResolvedValue(updatedIngredient);

      createNotification.mockRejectedValue(new Error("notif failed"));

      await updateIngredient(req, res);

      expect(createNotification).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith(updatedIngredient);
    })

    it("should trim and lowercase the name before updating", async () => {
      req.params.ingredientId = "ing1";
      req.body = { name: "  ToMaTo  " };

      const updatedIngredient = { _id: "ing1", name: "tomato" };

      Ingredient.findOneAndUpdate.mockResolvedValue(updatedIngredient);

      await updateIngredient(req, res);

      expect(Ingredient.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user123",
          _id: "ing1"
        }),
        expect.objectContaining({
          name: "tomato"
        }),
        expect.any(Object)
      );
    });

    it("should handle duplicate key error by returning status code 409 and error message", async () => {
      const duplicateError = { code: 11000 };

      Ingredient.findOneAndUpdate.mockRejectedValue(duplicateError);

      await updateIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(409);

      expect(res.json).toHaveBeenCalledWith({ message: "Ingredient with this name already exists" });
    });

    it("should handle failure by returning status code 500 and error message", async () => {
      Ingredient.findOneAndUpdate.mockRejectedValue(new Error());

      await updateIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({ message: "Error updating ingredient." });
    });

    it("should return 400 if update body is empty", async () => {
      req.body = {};

      await updateIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should still return 200 if no fields were changed", async () => {
      const ingredient = { _id: "ing1", name: "tomato" };

      Ingredient.findOneAndUpdate.mockResolvedValue(ingredient);

      await updateIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  })

  describe("updateIngredientBatch", () => {

    beforeEach(() => {
      req = {
        params: { batchId: "batch123" },
        body: {},
        user: { id: "user123" }
      };
      res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      vi.clearAllMocks();
    });

    // ✅ SUCCESS CASE
    it("should update ingredient batch and return 200", async () => {
      req.body = { quantity: 5 };

      IngredientBatch.findOneAndUpdate.mockResolvedValue({
        _id: "batch123",
        quantity: 5,
        ingredientId: { name: "tomato", _id: "ing1" }
      });

      await updateIngredientBatch(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        _id: "batch123",
        quantity: 5,
        ingredientId: { name: "tomato", _id: "ing1" }
      });
    });

    // ✅ 404
    it("should return 404 if batch is not found", async () => {
      req.body = { quantity: 5 };
      IngredientBatch.findOneAndUpdate.mockResolvedValue(null);

      await updateIngredientBatch(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Ingredient batch not found." });
    });

    // ✅ 500
    it("should handle failure by returning 500 and error message", async () => {
      req.body = { quantity: 5 };
      IngredientBatch.findOneAndUpdate.mockRejectedValue(new Error("DB error"));

      await updateIngredientBatch(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error updating ingredient batch." });
    });

    // ✅ ingredient_used notification
    it("should create 'ingredient_used' notification when marked as used", async () => {
      req.body = { isUsed: true };

      IngredientBatch.findOneAndUpdate.mockResolvedValue({
        _id: "batch123",
        isUsed: true,
        ingredientId: { name: "tomato", _id: "ing1" }
      });

      getNotificationMessage.mockReturnValue("ingredient used message");

      await updateIngredientBatch(req, res);

      expect(getNotificationMessage).toHaveBeenCalledWith("ingredient_used", "tomato");
      expect(createNotification).toHaveBeenCalledWith(
        "user123",
        "ingredient_used",
        "ingredient used message",
        "ing1",
        "tomato"
      );
    });

    // ✅ ingredient_edited notification
    it("should create 'ingredient_edited' notification when batch is updated", async () => {
      req.body = { quantity: 10 };

      IngredientBatch.findOneAndUpdate.mockResolvedValue({
        _id: "batch123",
        quantity: 10,
        ingredientId: { name: "tomato", _id: "ing1" }
      });

      getNotificationMessage.mockReturnValue("ingredient edited message");

      await updateIngredientBatch(req, res);

      expect(getNotificationMessage).toHaveBeenCalledWith("ingredient_edited", "tomato");
      expect(createNotification).toHaveBeenCalledWith(
        "user123",
        "ingredient_edited",
        "ingredient edited message",
        "ing1",
        "tomato"
      );
    });

    // ✅ notification failure should not break
    it("should still succeed even if notification fails", async () => {
      req.body = { quantity: 10 };

      IngredientBatch.findOneAndUpdate.mockResolvedValue({
        _id: "batch123",
        quantity: 10,
        ingredientId: { name: "tomato", _id: "ing1" }
      });

      createNotification.mockRejectedValue(new Error("notif failed"));

      await updateIngredientBatch(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    // ✅ invalid quantity
    it("should return 400 for invalid quantity", async () => {
      req.body = { quantity: -5 };

      await updateIngredientBatch(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Quantity must be a positive number." });
    });

    // ✅ empty body
    it("should return 400 if update body is empty", async () => {
      req.body = {};

      await updateIngredientBatch(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "At least one field is required to update." });
    });

    // ✅ invalid date
    it("should return 400 for invalid date format", async () => {
      req.body = { dateAdded: "invalid-date" };

      await updateIngredientBatch(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid date format." });
    });

    // ✅ expiry before dateAdded
    it("should return 400 if expiryDate is before dateAdded", async () => {
      req.body = {
        dateAdded: "2025-01-10",
        expiryDate: "2025-01-01"
      };

      await updateIngredientBatch(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Expiry date cannot be before date added." });
    });
  });

  describe("deleteIngredient", () => {

    beforeEach(() => {
      req.params.ingredientId = "ing1";
    });
    
    it("should delete ingredient", async () => {
      Ingredient.findOne.mockResolvedValue({ _id: "ing1", name: "tomato" });
      IngredientBatch.deleteMany.mockResolvedValue({});
      Ingredient.findOneAndDelete.mockResolvedValue({});

      await deleteIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({ message: "Ingredient deleted successfully." });
    });

    it("should return 404 if ingredient not found", async () => {
      Ingredient.findOne.mockResolvedValue(null);

      await deleteIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({ message: "Ingredient not found." });
    });

    it("should handle failure by returning 500 and error message", async () => {
      Ingredient.findOne.mockRejectedValue(new Error());

      await deleteIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({ message: "Error deleting ingredient." });

    });
    
    it("should create notification when ingredient is deleted", async () => {
      Ingredient.findOne.mockResolvedValue({ _id: "ing1", name: "tomato" });
      IngredientBatch.deleteMany.mockResolvedValue({});
      Ingredient.findOneAndDelete.mockResolvedValue({});

      getNotificationMessage.mockReturnValue("mock message");

      await deleteIngredient(req, res);

      expect(getNotificationMessage).toHaveBeenCalledWith("ingredient_deleted","tomato");

      expect(createNotification).toHaveBeenCalledWith("user123", "ingredient_deleted", "mock message", null, "tomato");
    });

    it("should still succeed even if notification fails", async () => {
      Ingredient.findOne.mockResolvedValue({ _id: "ing1", name: "tomato" });
      IngredientBatch.deleteMany.mockResolvedValue({});
      Ingredient.findOneAndDelete.mockResolvedValue({});

      createNotification.mockRejectedValue(new Error());

      await deleteIngredient(req, res);

      expect(createNotification).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({ message: "Ingredient deleted successfully." });
    });

    it("should not delete already deleted ingredient", async () => {
      Ingredient.findOne.mockResolvedValue(null);

      await deleteIngredient(req, res);

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({ message: "Ingredient not found." });
    });
  })

  describe("deleteIngredientBatch", () => {

    beforeEach(() => {
      req.params.batchId = "batch1";
    })

    it("should delete ingredient batch", async () => {
      const mockBatch = {
        _id: "batch1",
        ingredientId: { _id: "ing1", name: "tomato" }
      };

      IngredientBatch.findOneAndUpdate.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockBatch)
      });

      await deleteIngredientBatch(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({ message: "Ingredient batch deleted successfully." });
    });

    it("should return 404 if batch not found", async () => {
      IngredientBatch.findOneAndUpdate.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      });

      await deleteIngredientBatch(req, res);

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({ message: "Ingredient batch not found." });
    });

    it("should handle failure by returning 500 and error message", async () => {
      IngredientBatch.findOneAndUpdate.mockReturnValue({
        populate: vi.fn().mockRejectedValue(new Error())
      });

      await deleteIngredientBatch(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({ message: "Error deleting ingredient batch." });
    });

    it("should create notification when batch is deleted", async () => {
      const mockBatch = {
        _id: "batch1",
        ingredientId: { _id: "ing1", name: "tomato" }
      };

      IngredientBatch.findOneAndUpdate.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockBatch)
      });

      getNotificationMessage.mockReturnValue("mock message");

      await deleteIngredientBatch(req, res);

      expect(getNotificationMessage).toHaveBeenCalledWith("ingredient_deleted", "tomato");

      expect(createNotification).toHaveBeenCalledWith("user123", "ingredient_deleted", "mock message", "ing1", "tomato");
    });

    it("should still succeed even if notificaiton fails", async () => {
      const mockBatch = {
        _id: "batch1",
        ingredientId: { _id: "ing1", name: "tomato" }
      };

      IngredientBatch.findOneAndUpdate.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockBatch)
      });

      createNotification.mockRejectedValue(new Error());

      await deleteIngredientBatch(req, res);

      expect(createNotification).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({ message: "Ingredient batch deleted successfully." });
    });

    it("should not delete batch if already marked deleted", async () => {
      IngredientBatch.findOneAndUpdate.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      });

      await deleteIngredientBatch(req, res);

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({ message: "Ingredient batch not found." });
    });
  })




});