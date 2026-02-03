import {
    deleteIngredientBatch,
    getBatchesPerIngredient,
    updateIngredientBatch,
} from "@/api/ingredients";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useIngredientBatches = (ingredientId: string) =>
    useQuery({
        queryKey: ["ingredient-batches", ingredientId],
        queryFn: () => getBatchesPerIngredient(ingredientId),
        enabled: !!ingredientId,
    });

export const useUpdateIngredientBatch = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: ({ ingredientId, batchId, payload }: any) =>
            updateIngredientBatch(ingredientId, batchId, payload),
        onSuccess: (_, variables) => {
            qc.invalidateQueries({
                queryKey: ["ingredient-batches", variables.ingredientId],
            });
            qc.invalidateQueries({ queryKey: ["ingredients"] });
        },
    });
};

export const useDeleteIngredientBatch = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: ({ ingredientId, batchId }: any) =>
            deleteIngredientBatch(ingredientId, batchId),
        onSuccess: (_, variables) => {
            qc.invalidateQueries({
                queryKey: ["ingredient-batches", variables.ingredientId],
            });
            qc.invalidateQueries({ queryKey: ["ingredients"] });
        },
    });
};
