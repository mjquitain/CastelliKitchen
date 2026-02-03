import {
    addIngredient,
    deleteIngredient,
    getIngredients,
    getIngredientsByCategory,
    updateIngredient,
} from "@/api/ingredients";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/* -------- GET -------- */

export const useIngredients = () =>
    useQuery({
        queryKey: ["ingredients"],
        queryFn: getIngredients,
    });

export const useIngredientsByCategory = (category: string) =>
    useQuery({
        queryKey: ["ingredients", category],
        queryFn: () => getIngredientsByCategory(category),
        enabled: !!category,
    });

/* -------- MUTATIONS -------- */

export const useAddIngredient = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: addIngredient,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["ingredients"] });
        },
    });
};

export const useUpdateIngredient = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: ({ ingredientId, payload }: any) =>
            updateIngredient(ingredientId, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["ingredients"] });
        },
    });
};

export const useDeleteIngredient = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: deleteIngredient,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["ingredients"] });
        },
    });
};