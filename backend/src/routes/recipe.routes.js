import { Router } from "express";
import { addRecipe, getRecipes, getRecipeById, updateRecipe, deleteRecipe } from "../controllers/recipe.controller.js";

const router = Router();

router.route('/').post(addRecipe);
router.route('/').get(getRecipes);
router.route('/:id').get(getRecipeById);
router.route('/:id').put(updateRecipe);
router.route('/:id').delete(deleteRecipe);

export default router;