import api from "@/lib/api";
import type { MealRecipe } from '@/types/recipe';

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const recipeApi = {
    getSaved: () => api.get<MealRecipe[]>('/savedrecipes'),

    // Save a new recipe
    saveExternal: (recipe: MealRecipe, isFavorite = false) => api.post('/savedrecipes', {
        apiRecipeId: recipe.idMeal,
        title: recipe.strMeal,
        image: recipe.strMealThumb,
        category: recipe.strCategory,
        area: recipe.strArea,
        instructions: recipe.strInstructions,
        strYoutube: recipe.strYoutube,
        ingredients: Object.keys(recipe)
            .filter(key => key.startsWith('strIngredient') && recipe[key])
            .map((key) => {
                const num = key.replace('strIngredient', '');
                return {
                    ingredient: recipe[key],
                    measure: recipe[`strMeasure${num}`] || ''
                };
            }),
        isFavorite
    }),

    // Toggle Favorite status
    toggleFavorite: (id: string) => api.patch(`/savedrecipes/favorites/${id}`),

    // Delete a recipe
    remove: (id: string) => api.delete(`/savedrecipes/${id}`),
};