import bcrypt from "bcrypt";
import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        firstname: { type: String, required: true, minLength: 1, maxLength: 50 },
        lastname: { type: String, required: true, minLength: 1, maxLength: 50 },
        username: { type: String, required: true, minLength: 1, maxLength: 20 },
        password: { type: String, required: true, minLength: 6, maxLength: 50 },
        email: { type: String, required: true, unique: true },

    },
    { timestamps: true }
)

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);
