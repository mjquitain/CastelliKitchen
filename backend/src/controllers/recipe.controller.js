import { bucket } from "../config/firebase.js";
import { Recipe } from "../models/recipe.model.js";
import { deleteFileFromStorage, uploadFileToStorage } from "../utils/fileUpload.js";

const addRecipe = async (req, res) => {
    try {
        let imageUrl = null;

        if (req.file) {
            const userId = req.user.id;
            const fileName = `recipes/${userId}/recipe-${Date.now()}`;
            const file = bucket.file(fileName);

            await file.save(req.file.buffer, {
                metadata: { contentType: req.file.mimetype }
            });

            await file.makePublic();
            imageUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
        }

        const recipeData = {
            ...req.body,
            ...(imageUrl && { imageUrl }),
            owner: req.user.id
        };
        const recipe = await Recipe.create(recipeData);

        res.status(201).json(recipe);
    } catch (error) {
        console.error('Error adding recipe:', error);
        res.status(400).json({ message: "Invalid request.", error: error.message });
    }
};

const getRecipes = async (req, res) => {
    const recipes = await Recipe.find();
    res.json(recipes);
};

const getRecipeById = async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
        res.status(404).json({ message: "Recipe not found." });
    }
    res.json(recipe);
}

const updateRecipe = async (req, res) => {
    try {
        let imageUrl = req.body.imageUrl;

        if (req.file) {
            const oldRecipe = await Recipe.findById(req.params.id);

            imageUrl = await uploadFileToStorage(req.file, `recipes/${req.user.id}`);

            if (oldRecipe?.imageUrl && oldRecipe.imageUrl.includes('storage.googleapis.com')) {
                try {
                    await deleteFileFromStorage(oldRecipe.imageUrl);
                } catch (deleteError) {
                    console.error('Error deleting old image:', deleteError);
                }
            }
        }

        const updateData = {
            ...req.body,
            ...(imageUrl && { imageUrl })
        };

        const recipe = await Recipe.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found." });
        }

        res.json(recipe);
    } catch (error) {
        console.error('Error updating recipe:', error);
        res.status(400).json({ message: "Invalid request.", error: error.message });
    }
}

const deleteRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
        if (!recipe) return res.status(404).json({ message: "Recipe not found or unauthorized" });

        if (recipe.imageUrl && recipe.imageUrl.includes('storage.googleapis.com')) {
            try {
                await deleteFileFromStorage(recipe.imageUrl);
            } catch (deleteError) {
                console.error('Error deleting recipe image:', deleteError);
            }
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ message: "Server error" });
    }
}


export {
    addRecipe, deleteRecipe, getRecipeById, getRecipes, updateRecipe
};

