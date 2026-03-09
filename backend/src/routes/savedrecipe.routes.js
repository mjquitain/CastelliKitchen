import { Router } from "express";
import { deleteSavedRecipe, getFavoriteRecipes, getSavedRecipes, saveRecipe, toggleFavoriteStatus, updateSavedRecipe } from "../controllers/savedrecipes.controller.js";
import authMiddleware from "../middleware/auth.js";
import { handleMulterError, upload } from "../middleware/upload.js";

const router = Router();

router.route('/').get(authMiddleware, getSavedRecipes);
router.route('/').post(
    authMiddleware,
    upload.single('image'),
    handleMulterError,
    saveRecipe
);
router.route('/favorites').get(authMiddleware, getFavoriteRecipes);
router.route('/favorites/:id').patch(authMiddleware, toggleFavoriteStatus);
router.route('/:id').put(
    authMiddleware,
    upload.single('image'),
    handleMulterError,
    updateSavedRecipe
);
router.route('/:id').delete(authMiddleware, deleteSavedRecipe);

export default router;