import mongoose, { Schema } from "mongoose";

const RecipeSchema = new Schema(
    {
        imageUrl: { type: String, required: false },
        name: { type: String, required: true, minLength: 1, maxLength: 100 },
        category: { type: String, enum: ['Beef', 'Chicken', 'Vegetarian', 'Vegan', 'Dessert', 'Lamb', 'Miscellaneous', 'Pasta', 'Seafood', 'Side', 'Pork', 'Breakfast', 'Goat', 'Starter'], required: true, minLength: 1, maxLength: 50 },
        area: { type: String, required: true, minLength: 1, maxLength: 50 },
        ingredients: { type: [String], required: true },
        instructions: { type: String, required: true, minLength: 10, maxLength: 3000 },
        videolink: { type: String, required: false }
    },
    { timestamps: true }
)

export const Recipe = mongoose.model("Recipe", RecipeSchema);