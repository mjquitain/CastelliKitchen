import mongoose, { Schema } from "mongoose";


const ingredientSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true, minLength: 1, maxLength: 50 },
        category: { type: String, enum: ['Protein', 'Dairy', 'Condiment', 'Grain', 'Fruit', 'Vegetable'], required: true, minLength: 1, maxLength: 50 }
    },
    { timestamps: true }
);

ingredientSchema.index(
    { userId: 1, name: 1 },
    { unique: true }
);

ingredientSchema.virtual("batches", {
  ref: "IngredientBatch",
  localField: "_id",
  foreignField: "ingredientId"
});

ingredientSchema.set("toJSON", { virtuals: true });
ingredientSchema.set("toObject", { virtuals: true });


export const Ingredient = mongoose.model("Ingredient", ingredientSchema);