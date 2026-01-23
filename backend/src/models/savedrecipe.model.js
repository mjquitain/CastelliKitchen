import mongoose, { Schema } from "mongoose";

const savedRecipeSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        apiRecipeId: { type: String, required: true },
        title: { type: String, required: true },
        category: { type: String },
        isFavorite: { type: Boolean, default: false },
        savedAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

savedRecipeSchema.index(
    { userId: 1, apiRecipeId: 1 },
    { unique: true }
);

export const SavedRecipe = mongoose.model("SavedRecipe", savedRecipeSchema);