import { recipeApi } from '@/api/recipes';
import type { MealRecipe } from '@/types/recipe';
import { useEffect, useState } from 'react';

export const useRecipes = () => {
    const [savedRecipes, setSavedRecipes] = useState<MealRecipe[]>([]);
    const favoriteRecipes = savedRecipes.filter(r => r.isFavorite);
    const [isLoading, setIsLoading] = useState(false);

    const fetchSaved = async () => {
        try {
            const res = await recipeApi.getSaved();
            const rawData = Array.isArray(res.data) ? res.data : [];
            const mappedData = rawData.map((r: any) => {
                const mapped: any = {
                    ...r,
                    idMeal: r.apiRecipeId,
                    strMeal: r.title,
                    strMealThumb: r.image,
                    strCategory: r.category,
                    strArea: r.area,
                    strInstructions: r.instructions,
                    strYoutube: r.strYoutube,
                    isFavorite: r.isFavorite,
                    _id: r._id,
                    apiRecipeId: r.apiRecipeId
                };

                if (r.ingredients && Array.isArray(r.ingredients)) {
                    r.ingredients.forEach((ing: any, index: number) => {
                        if (ing && ing.ingredient) {
                            mapped[`strIngredient${index + 1}`] = ing.ingredient;
                            mapped[`strMeasure${index + 1}`] = ing.measure || '';
                        }
                    });
                }

                return mapped;
            });

            setSavedRecipes(mappedData);
        } catch (err) {
            console.error("Failed to load recipes", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (recipe: MealRecipe) => {
        try {
            await recipeApi.saveExternal(recipe);
            await fetchSaved();
        } catch (err) {
            console.error("Save failed", err);
        }
    };

    const handleFavorite = async (recipe: any) => {
        try {
            const apiRecipeId = recipe.apiRecipeId || recipe.idMeal;

            let existingRecipe = savedRecipes.find(
                (r: any) => r.apiRecipeId === apiRecipeId
            );

            if (!existingRecipe) {
                await recipeApi.saveExternal(recipe, true);
                await fetchSaved();
            } else {
                await recipeApi.toggleFavorite(existingRecipe._id);
                await fetchSaved();
            }
        } catch (error: any) {
            console.error(
                "Toggle favorite failed:",
                error.response?.data || error.message
            );
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const recipe = savedRecipes.find(r => r.idMeal === id || r._id === id);
            if (recipe && recipe._id) {
                await recipeApi.remove(recipe._id);
                await fetchSaved();
            }
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    useEffect(() => { fetchSaved(); }, []);

    return {
        isLoading,
        handleSave,
        handleFavorite,
        handleDelete,
        fetchSaved,
        savedRecipes,
        favoriteRecipes
    };
};