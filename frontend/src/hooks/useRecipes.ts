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
                    apiRecipeId: r.apiRecipeId,
                    isCustom: String(r.apiRecipeId).startsWith('custom-'),
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

    const handleSave = async (recipe: MealRecipe, imageFile?: File | null) => {
        try {
            await recipeApi.saveExternal(recipe, false, imageFile);
            await fetchSaved();
        } catch (err) {
            console.error("Save failed", err);
        }
    };

    const handleFavorite = async (recipe: any, imageFile?: File | null) => {
        try {
            const apiRecipeId = recipe.apiRecipeId || recipe.idMeal;

            let existingRecipe = savedRecipes.find(
                (r: any) => r.apiRecipeId === apiRecipeId
            );

            if (!existingRecipe) {
                await recipeApi.saveExternal(recipe, true, imageFile);
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

    const handleDelete = async (recipe: MealRecipe) => {
        const targetId = recipe._id;
        if (!targetId) return;

        if (window.confirm(`Are you sure you want to delete ${recipe.strMeal}?`)) {
            try {
                await recipeApi.remove(targetId);
                await fetchSaved();
            } catch (err) {
                console.error("Delete failed", err);
            }
        }
    };

    const handleUpdate = async (updatedRecipe: any, imageFile?: File | null) => {
        if (!updatedRecipe.isCustom) {
            console.error("Cannot edit API-sourced recipes");
            return;
        }
        try {
            setIsLoading(true);

            const payload = {
                title: updatedRecipe.strMeal,
                image: updatedRecipe.strMealThumb,
                category: updatedRecipe.strCategory,
                area: updatedRecipe.strArea,
                instructions: updatedRecipe.strInstructions,
                ingredients: Object.keys(updatedRecipe)
                    .filter(key => key.startsWith('strIngredient') && updatedRecipe[key])
                    .map(key => {
                        const index = key.replace('strIngredient', '');
                        return {
                            ingredient: updatedRecipe[key],
                            measure: updatedRecipe[`strMeasure${index}`] || ''
                        };
                    })
            };
            await recipeApi.update(updatedRecipe._id, payload, imageFile)
            await fetchSaved();
        } catch (err) {
            console.error("Update failed", err);
        } finally {
            setIsLoading(false);
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
        favoriteRecipes,
        handleUpdate
    };
};