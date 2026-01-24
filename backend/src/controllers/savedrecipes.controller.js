import { SavedRecipe } from "../models/savedrecipe.model.js";

const saveRecipe = async (req, res) => {

    try {
        const { apiRecipeId, title, category, isFavorite } = req.body;

        const existingRecipe = await SavedRecipe.findOne({ apiRecipeId, userId: req.user._id });

        // Prevent duplicate saved recipes
        if (existingRecipe) {
            return res.status(409).json({ message: "Recipe already saved." });
        }

        // Create and save recipe
        const savedRecipe = await SavedRecipe.create({
            userId: req.user.id,
            apiRecipeId,
            title,
            category,
            isFavorite: isFavorite || false,
        });

        res.status(201).json(savedRecipe);

    } catch (error) {
        res.status(500).json({ message: "Error saving recipe.", error });
    }
};

const getSavedRecipes = async (req, res) => {
    try {
        const savedRecipes = await SavedRecipe.find({ userId: req.user.id })
            .sort({ savedAt: -1 });

        res.status(200).json(savedRecipes);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving saved recipes.", error });
    }
};

const getFavoriteRecipes = async (req, res) => {
    try {
        const favoriteRecipes = await SavedRecipe.find({ userId: req.user.id, isFavorite: true });
        res.status(200).json(favoriteRecipes);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving favorite recipes.", error });
    }
};

const toggleFavoriteStatus = async (req, res) => {
    try {
        const togglerecipe = await SavedRecipe.findOne({ _id: req.params.id, userId: req.user.id });

        if (!togglerecipe) {
            return res.status(404).json({ message: "Recipe not found." });
        }

        togglerecipe.isFavorite = !togglerecipe.isFavorite;
        await togglerecipe.save();
        res.status(200).json(togglerecipe);
    } catch (error) {
        res.status(500).json({ message: "Error updating favorite status.", error });
    }
};

const deleteSavedRecipe = async (req, res) => {
    try {
        const deletedRecipe = await SavedRecipe.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!deletedRecipe) {
            return res.status(404).json({ message: "Recipe not found." });
        }
        res.status(200).json({ message: "Recipe deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting recipe.", error });
    }
};

export { deleteSavedRecipe, getFavoriteRecipes, getSavedRecipes, saveRecipe, toggleFavoriteStatus };

