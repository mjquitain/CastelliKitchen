import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        type: {
            type: String,
            enum: [
                'ingredient_expired',
                'ingredient_expiring',
                'ingredient_deleted',
                'ingredient_used',
                'ingredient_edited',
                'ingredient_added',
                'recipe_added',
                'recipe_saved',
                'recipe_favorited',
                'recipe_unfavorited'
            ],
            required: true
        },
        message: { type: String, required: true },
        relatedId: { type: Schema.Types.ObjectId },
        relatedName: { type: String },
        isRead: { type: Boolean, default: false }
    },
    { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

export const Notification = mongoose.model("Notification", notificationSchema);
