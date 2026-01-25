import mongoose, { Schema } from "mongoose";

const ingredientBatchSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        ingredientId: { type: Schema.Types.ObjectId, ref: "Ingredient", required: true },
        quantity: { type: String, required: true, minLength: 1, maxLength: 50 },
        dateAdded: { type: Date, required: true },
        expiryDate: { type: Date, required: true },
        isUsed: { type: Boolean, default: false }
    },
    { timestamps: true }
);

ingredientBatchSchema.index({ ingredientId: 1, expiryDate: 1 });

export const IngredientBatch = mongoose.model("IngredientBatch", ingredientBatchSchema)