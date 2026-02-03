import api from "@/lib/api";
import type { Ingredient, IngredientBatch } from "@/types/ingredients";

// GET /ingredients
export const getIngredients = async (): Promise<Ingredient[]> => {
    const { data } = await api.get("/ingredients");
    return data;
};

// GET /ingredients/category/:category
export const getIngredientsByCategory = async (category: string) => {
    const { data } = await api.get(`/ingredients/category/${category}`);
    return data;
};

// POST /ingredients
export const addIngredient = async (payload: {
    name: string;
    quantity: string;
    category: string;
    dateAdded: string;
    expiryDate: string;
}) => {
    const { data } = await api.post("/ingredients", payload);
    return data;
};

// PUT /ingredients/:ingredientId
export const updateIngredient = async (
    ingredientId: string,
    payload: { name?: string; category?: string }
) => {
    const { data } = await api.put(
        `/ingredients/${ingredientId}`,
        payload
    );
    return data;
};

// DELETE /ingredients/:ingredientId
export const deleteIngredient = async (ingredientId: string) => {
    const { data } = await api.delete(`/ingredients/${ingredientId}`);
    return data;
};

// GET /ingredients/:ingredientId/batches
export const getBatchesPerIngredient = async (
    ingredientId: string
): Promise<IngredientBatch[]> => {
    const { data } = await api.get(
        `/ingredients/${ingredientId}/batches`
    );
    return data;
};

// GET /ingredients/:ingredientId/batches/:batchId
export const getIngredientBatch = async (
    ingredientId: string,
    batchId: string
) => {
    const { data } = await api.get(
        `/ingredients/${ingredientId}/batches/${batchId}`
    );
    return data;
};

// PUT /ingredients/:ingredientId/batches/:batchId
export const updateIngredientBatch = async (
    ingredientId: string,
    batchId: string,
    payload: {
        quantity?: string;
        expiryDate?: string;
        isUsed?: boolean;
    }
) => {
    const { data } = await api.put(
        `/ingredients/${ingredientId}/batches/${batchId}`,
        payload
    );
    return data;
};

// DELETE /ingredients/:ingredientId/batches/:batchId
export const deleteIngredientBatch = async (
    ingredientId: string,
    batchId: string
) => {
    const { data } = await api.delete(
        `/ingredients/${ingredientId}/batches/${batchId}`
    );
    return data;
};
