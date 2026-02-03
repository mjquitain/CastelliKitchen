export type Category =
    | "Protein"
    | "Dairy"
    | "Condiment"
    | "Grain"
    | "Fruit"
    | "Vegetable";

export interface IngredientBatch {
    _id: string;
    ingredientId: string;
    quantity: string;
    dateAdded: string;
    expiryDate: string;
    isUsed: boolean;
}

export interface Ingredient {
    _id: string;
    name: string;
    category: Category;
    batches: IngredientBatch[];
}