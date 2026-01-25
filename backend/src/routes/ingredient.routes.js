import { Router } from "express";
import { addIngredient, getIngredients, getIngredientsByCategory, getBatchesPerIngredient, getIngredientBatch, updateIngredient, updateIngredientBatch, deleteIngredient, deleteIngredientBatch } from "../controllers/ingredient.controller.js";

const router = Router();

router.route('/').post(addIngredient);

router.route('/').get(getIngredients);
router.route('/category/:category').get(getIngredientsByCategory);
router.route('/:ingredientId/batches').get(getBatchesPerIngredient);

router.route('/:ingredientId').put(updateIngredient);
router.route('/:ingredientId/batches/:batchId').put(updateIngredientBatch);

router.route('/:ingredientId').delete(deleteIngredient);
router.route('/:ingredientId/batches/:batchId').delete(deleteIngredientBatch);

export default router;