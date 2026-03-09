import api, { getToken } from "@/lib/api";
import type { MealRecipe } from '@/types/recipe';

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const recipeApi = {
    getSaved: () => api.get<MealRecipe[]>('/savedrecipes'),

    // Save a new recipe
    saveExternal: (recipe: MealRecipe, isFavorite = false, imageFile?: File | null) => {
        if (imageFile) {
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('apiRecipeId', recipe.idMeal);
            formData.append('title', recipe.strMeal);
            formData.append('category', recipe.strCategory || '');
            formData.append('area', recipe.strArea || '');
            formData.append('instructions', recipe.strInstructions || '');
            formData.append('strYoutube', recipe.strYoutube || '');
            formData.append('isFavorite', String(isFavorite));

            const ingredients = Object.keys(recipe)
                .filter(key => key.startsWith('strIngredient') && recipe[key])
                .map((key) => {
                    const num = key.replace('strIngredient', '');
                    return {
                        ingredient: recipe[key],
                        measure: recipe[`strMeasure${num}`] || ''
                    };
                });
            formData.append('ingredients', JSON.stringify(ingredients));

            return api.post('/savedrecipes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }

        return api.post('/savedrecipes', {
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
        });
    },

    // Toggle Favorite status
    toggleFavorite: (id: string) => api.patch(`/savedrecipes/favorites/${id}`),

    // Update a recipe
    update: (id: string, payload: any, imageFile?: File | null) => {
        if (imageFile) {
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('title', payload.title);
            formData.append('category', payload.category || '');
            formData.append('area', payload.area || '');
            formData.append('instructions', payload.instructions || '');
            formData.append('ingredients', JSON.stringify(payload.ingredients));

            return api.put(`/savedrecipes/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }

        return api.put(`/savedrecipes/${id}`, payload);
    },

    // Delete a recipe
    remove: (id: string) => api.delete(`/savedrecipes/${id}`),
};

export const mealdbApi = {
    filterByIngredient: (ingredient: string) =>
        api.get(`/mealdb/filter`, { params: { ingredient } }),

    search: (s: string) =>
        api.get(`/mealdb/search`, { params: { s } }),

    lookupById: (id: string) =>
        api.get(`/mealdb/lookup/${id}`),
};