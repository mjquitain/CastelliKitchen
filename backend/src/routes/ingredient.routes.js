import { Router } from "express";
import { addIngredient, getIngredients, getIngredientsByCategory, getBatchesPerIngredient, getIngredientBatch, updateIngredient, updateIngredientBatch, deleteIngredient, deleteIngredientBatch } from "../controllers/ingredient.controller.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.route('/').post(authMiddleware, addIngredient);

router.route('/').get(authMiddleware, getIngredients);
router.route('/category/:category').get(authMiddleware, getIngredientsByCategory);
router.route('/:ingredientId/batches').get(authMiddleware, getBatchesPerIngredient);
router.route('/:ingredientId/batches/:batchId').get(authMiddleware, getIngredientBatch);

router.route('/:ingredientId').put(authMiddleware, updateIngredient);
router.route('/:ingredientId/batches/:batchId').put(authMiddleware, updateIngredientBatch);

router.route('/:ingredientId').delete(authMiddleware, deleteIngredient);
router.route('/:ingredientId/batches/:batchId').delete(authMiddleware, deleteIngredientBatch);

export default router;