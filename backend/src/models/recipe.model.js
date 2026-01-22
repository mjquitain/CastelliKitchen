import mongoose, { Schema } from "mongoose";

const RecipeSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            minLength: 1,
            maxLength: 100
        },
        category: {
            type: String,
            enum: ['Beef', 'Chicken', 'Vegetarian', 'Vegan', 'Dessert', 'Lamb', 'Miscellaneous', 'Pasta', 'Seafood', 'Side', 'Pork', 'Breakfast', 'Goat', 'Starter'],
            required: true,
            minLength: 1,
            maxLength: 50
        },
        area: {
            type: String,
            required: true,
            minLength: 1,
            maxLength: 50
        },
        ingredients: {
            type: [String],
            required: true,
            // ? ingredients are in long text, separated by comma
        },
        instructions: {
            type: String,
            required: true,
            minLength: 10,
            maxLength: 3000
        },
        videolink: {
            type: String,
            required: false,
            // min and max length
        }
    },
    {
        timestamps: true
    }
)

export const Recipe = mongoose.model("Recipe", RecipeSchema);