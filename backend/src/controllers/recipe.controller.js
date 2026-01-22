import { Recipe } from "../models/recipe.model.js";

const addRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.create(req.body);
        res.status(201).json(recipe);
    } catch (error) {
        res.status(400).json({message: "Invalid request."});
    }
};

const getRecipes = async (req, res) => {
    const recipes = await Recipe.find();
    res.json(recipes);
};

const getRecipeById = async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
        res.status(404).json({message: "Recipe not found."});
    }
    res.json(recipe);
}

const updateRecipe = async (req, res) => {
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(recipe);
}

const deleteRecipe = async (req, res) => {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    res.status(204).end;
}


export {
    addRecipe, getRecipes, getRecipeById, updateRecipe, deleteRecipe
};