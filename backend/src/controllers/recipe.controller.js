import { Recipe } from "../models/recipe.model.js";

const addRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.create({ ...req.body, owner: req.user.id });
        res.status(201).json(recipe);
    } catch (error) {
        res.status(400).json({ message: "Invalid request." });
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
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(recipe);
}

const deleteRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
        if (!recipe) return res.status(404).json({ message: "Recipe not found or unauthorized" });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}


export {
    addRecipe, deleteRecipe, getRecipeById, getRecipes, updateRecipe
};
