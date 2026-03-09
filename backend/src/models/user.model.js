import bcrypt from "bcrypt";
import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        firstname: { type: String, required: true, minLength: 1, maxLength: 50 },
        lastname: { type: String, required: true, minLength: 1, maxLength: 50 },
        username: { type: String, required: true, minLength: 1, maxLength: 20 },
        password: {
            type: String,
            required: function () {
                return this.authProvider === 'local';
            },
            minLength: 6,
        },
        email: { type: String, required: true, unique: true },
        googleId: { type: String, unique: true, sparse: true },
        authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
        avatar: { type: String },
        resetPasswordToken: { type: String },
        resetPasswordExpires: { type: Date },
        emailVerified: { type: Boolean, default: false },
        emailVerificationToken: { type: String },
        emailVerificationExpires: { type: Date },
    },
    { timestamps: true }
)

// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password") || !this.password) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare password
userSchema.methods.comparePassword = async function (password) {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);
