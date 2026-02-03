export interface MealRecipe {
    idMeal: string;
    strMeal: string;
    strMealThumb: string;
    strCategory: string;
    strArea: string;
    strInstructions: string;
    strYoutube: string;
    isFavorite?: boolean;
    [key: string]: any;
}

export type ActionType = 'save' | 'favorite';