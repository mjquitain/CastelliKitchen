import { SavedRecipe } from "../models/savedrecipe.model.js";
import { createNotification, getNotificationMessage } from "../utils/notificationHelper.js";

const saveRecipe = async (req, res) => {

    try {
        const { apiRecipeId, title, category, isFavorite, image, instructions, area, strYoutube, ingredients } = req.body;

        const existingRecipe = await SavedRecipe.findOne({ apiRecipeId, userId: req.user.id });

        if (existingRecipe) {
            return res.status(409).json({ message: "Recipe already saved.", recipe: existingRecipe });
        }

        const savedRecipe = await SavedRecipe.create({
            userId: req.user.id,
            apiRecipeId,
            title,
            category,
            area,
            image,
            instructions,
            strYoutube,
            ingredients,
            isFavorite: isFavorite || false,
        });

        try {
            const notificationType = isFavorite ? 'recipe_favorited' : 'recipe_saved';
            await createNotification(
                req.user.id,
                notificationType,
                getNotificationMessage(notificationType, title),
                savedRecipe._id,
                title
            );
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
        }

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
        const togglerecipe = await SavedRecipe.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!togglerecipe) {
            return res.status(404).json({ message: "Recipe not found." });
        }

        const wasFavorite = togglerecipe.isFavorite;
        togglerecipe.isFavorite = !togglerecipe.isFavorite;
        await togglerecipe.save();


        try {
            if (togglerecipe.isFavorite && !wasFavorite) {
                await createNotification(
                    req.user.id,
                    'recipe_favorited',
                    getNotificationMessage('recipe_favorited', togglerecipe.title),
                    togglerecipe._id,
                    togglerecipe.title
                );
            } else if (!togglerecipe.isFavorite && wasFavorite) {
                await createNotification(
                    req.user.id,
                    'recipe_unfavorited',
                    getNotificationMessage('recipe_unfavorited', togglerecipe.title),
                    togglerecipe._id,
                    togglerecipe.title
                );
            }
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
        }

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

const updateSavedRecipe = async (req, res) => {
    try {
        const { title, category, area, image, instructions, strYoutube, ingredients } = req.body;

        const recipe = await SavedRecipe.findOne({ _id: req.params.id, userId: req.user.id });

        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found." });
        }

        if (title !== undefined) recipe.title = title;
        if (category !== undefined) recipe.category = category;
        if (area !== undefined) recipe.area = area;
        if (image !== undefined) recipe.image = image;
        if (instructions !== undefined) recipe.instructions = instructions;
        if (strYoutube !== undefined) recipe.strYoutube = strYoutube;
        if (ingredients !== undefined) recipe.ingredients = ingredients;

        await recipe.save();

        try {
            await createNotification(
                req.user.id,
                'recipe_updated',
                getNotificationMessage('recipe_updated', recipe.title),
                recipe._id,
                recipe.title
            );
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
        }

        res.status(200).json(recipe);
    } catch (error) {
        res.status(500).json({ message: "Error updating recipe.", error });
    }
};

export { deleteSavedRecipe, getFavoriteRecipes, getSavedRecipes, saveRecipe, toggleFavoriteStatus, updateSavedRecipe };

