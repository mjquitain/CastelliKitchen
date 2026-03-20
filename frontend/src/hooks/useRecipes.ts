import { mealdbApi, recipeApi } from '@/api/recipes';
import { showActionError, showActionSuccess } from '@/lib/actionNotifications';
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
                const normalizedIngredients = Array.isArray(r.ingredients)
                    ? r.ingredients
                    : [];

                const mapped: any = {
                    ...r,
                    idMeal: r.apiRecipeId || r.idMeal || r._id,
                    strMeal: r.title || r.strMeal || '',
                    strMealThumb: r.image || r.strMealThumb || 'https://placehold.co/600x400?text=Recipe',
                    strCategory: r.category || r.strCategory || '',
                    strArea: r.area || r.strArea || '',
                    strInstructions: r.instructions || r.strInstructions || '',
                    strYoutube: r.strYoutube || '',
                    isFavorite: r.isFavorite,
                    _id: r._id,
                    apiRecipeId: r.apiRecipeId || r.idMeal || r._id,
                    isCustom: String(r.apiRecipeId || r.idMeal || '').startsWith('custom-'),
                };

                if (normalizedIngredients.length > 0) {
                    normalizedIngredients.forEach((ing: any, index: number) => {
                        const ingredient = ing?.ingredient || ing?.name || ing?.strIngredient;
                        const measure = ing?.measure || ing?.amount || ing?.strMeasure || '';

                        if (ingredient) {
                            mapped[`strIngredient${index + 1}`] = ingredient;
                            mapped[`strMeasure${index + 1}`] = measure;
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

    const getRecipeWithDetails = async (recipe: MealRecipe): Promise<MealRecipe> => {
        const isCustomRecipe =
            (recipe as any).isCustom ||
            String((recipe as any).apiRecipeId || recipe.idMeal || '').startsWith('custom-');

        if (isCustomRecipe) {
            return recipe;
        }

        const hasInstructions = !!recipe.strInstructions;
        const hasAnyIngredients = Object.keys(recipe).some(
            (key) => key.startsWith('strIngredient') && recipe[key]
        );

        if (hasInstructions && hasAnyIngredients) {
            return recipe;
        }

        if (!recipe.idMeal) {
            return recipe;
        }

        try {
            const detailRes = await mealdbApi.lookupById(recipe.idMeal);
            const detailed = detailRes?.data?.meals?.[0];
            if (!detailed) {
                return recipe;
            }

            return {
                ...detailed,
                ...recipe,
                strInstructions: recipe.strInstructions || detailed.strInstructions || '',
                strCategory: recipe.strCategory || detailed.strCategory || '',
                strArea: recipe.strArea || detailed.strArea || '',
                strYoutube: recipe.strYoutube || detailed.strYoutube || '',
            };
        } catch (error) {
            console.error('Failed to hydrate recipe details before save:', error);
            return recipe;
        }
    };

    const handleSave = async (recipe: MealRecipe, imageFile?: File | null) => {
        try {
            const recipeToSave = await getRecipeWithDetails(recipe);
            await recipeApi.saveExternal(recipeToSave, false, imageFile);
            await fetchSaved();
            showActionSuccess({
                title: 'Saved',
                message: `${recipe.strMeal} was successfully saved.`,
            });
        } catch (err) {
            console.error("Save failed", err);
            showActionError({
                title: 'Save failed',
                message: 'Unable to save recipe. Please try again.',
            });
        }
    };

    const handleFavorite = async (recipe: any, imageFile?: File | null) => {
        try {
            const apiRecipeId = recipe.apiRecipeId || recipe.idMeal;

            let existingRecipe = savedRecipes.find(
                (r: any) => r.apiRecipeId === apiRecipeId
            );

            if (!existingRecipe) {
                const recipeToSave = await getRecipeWithDetails(recipe);
                await recipeApi.saveExternal(recipeToSave, true, imageFile);
                await fetchSaved();
                showActionSuccess({
                    title: 'Favorited',
                    message: `${recipe.strMeal} was added to favorites.`,
                });
            } else {
                const wasFavorite = !!existingRecipe.isFavorite;
                await recipeApi.toggleFavorite(existingRecipe._id);
                await fetchSaved();
                showActionSuccess({
                    title: wasFavorite ? 'Unfavorited' : 'Favorited',
                    message: wasFavorite
                        ? `${recipe.strMeal} was removed from favorites.`
                        : `${recipe.strMeal} was added to favorites.`,
                });
            }
        } catch (error: any) {
            console.error(
                "Toggle favorite failed:",
                error.response?.data || error.message
            );
            showActionError({
                title: 'Favorite update failed',
                message: 'Unable to update favorite status. Please try again.',
            });
        }
    };

    const handleDelete = async (recipe: MealRecipe) => {
        const targetId =
            recipe._id ||
            savedRecipes.find(
                (r: any) =>
                    r.apiRecipeId === (recipe as any).apiRecipeId ||
                    r.apiRecipeId === recipe.idMeal ||
                    r.idMeal === recipe.idMeal
            )?._id;

        if (!targetId) return;

        try {
            await recipeApi.remove(targetId);
            await fetchSaved();
            showActionSuccess({
                title: 'Deleted',
                message: `${recipe.strMeal} was successfully deleted.`,
            });
        } catch (err) {
            console.error("Delete failed", err);
            showActionError({
                title: 'Delete failed',
                message: 'Unable to delete recipe. Please try again.',
            });
        }
    };

    const handleUpdate = async (updatedRecipe: any, imageFile?: File | null) => {
        if (!updatedRecipe.isCustom) {
            console.error("Cannot edit API-sourced recipes");
            showActionError({
                title: 'Update blocked',
                message: 'Only custom recipes can be edited.',
            });
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
            showActionSuccess({
                title: 'Updated',
                message: `${updatedRecipe.strMeal} was successfully updated.`,
            });
        } catch (err) {
            console.error("Update failed", err);
            showActionError({
                title: 'Update failed',
                message: 'Unable to update recipe. Please try again.',
            });
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