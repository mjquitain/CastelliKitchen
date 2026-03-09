import { Router } from "express";
import { addRecipe, deleteRecipe, getRecipeById, getRecipes, updateRecipe } from "../controllers/recipe.controller.js";
import authMiddleware from "../middleware/auth.js";
import { handleMulterError, upload } from "../middleware/upload.js";

const router = Router();

// POST - Create a new recipe 
router.route('/').post(
    authMiddleware,
    upload.single('image'),
    handleMulterError,
    addRecipe
);

// GET - Get all recipes
router.route('/').get(getRecipes);

// GET - Get recipe by ID
router.route('/:id').get(getRecipeById);

// PUT - Update a recipe 
router.route('/:id').put(
    authMiddleware,
    upload.single('image'),
    handleMulterError,
    updateRecipe
);

// DELETE - Delete a recipe
router.route('/:id').delete(authMiddleware, deleteRecipe);

export default router;