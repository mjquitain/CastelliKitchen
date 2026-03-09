import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { bucket } from "../config/firebase.js";
import { Ingredient } from "../models/ingredient.model.js";
import { IngredientBatch } from "../models/ingredientbatch.model.js";
import { Notification } from "../models/notification.model.js";
import { SavedRecipe } from "../models/savedrecipe.model.js";
import { User } from "../models/user.model.js";
import { deleteFileFromStorage } from "../utils/fileUpload.js";

const registerUser = async (req, res) => {

  try {
    const { firstname, lastname, username, password, email } = req.body;

    // Validation
    if (!firstname || !lastname || !username || !password || !email) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least one uppercase letter." });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least one lowercase letter." });
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least one special character." });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use." });
    }

    // Create new user
    const newUser = await User.create({
      firstname,
      lastname,
      username,
      password,
      email: email.toLowerCase(),
      authProvider: 'local',
    });

    // verification email
    const verificationToken = crypto.randomBytes(32).toString("hex");
    newUser.emailVerificationToken = verificationToken;
    newUser.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await newUser.save({ validateBeforeSave: false });

    const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyURL = `${frontendURL}/verify-email?token=${verificationToken}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"Castelli Kitchen" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: newUser.email,
      subject: "Verify your email address",
      html: `
        <p>Hi ${newUser.firstname},</p>
        <p>Thanks for signing up! Please verify your email address by clicking the link below. This link expires in 24 hours.</p>
        <p><a href="${verifyURL}">${verifyURL}</a></p>
        <p>If you did not create an account, please ignore this email.</p>
      `,
    });

    res.status(201).json({ message: "Registration successful. Please check your email to verify your account.", emailVerificationRequired: true });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    // Check if user exists
    const { email, password } = req.body;
    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.authProvider === 'local' && !user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in. Check your inbox for a verification link.",
        emailNotVerified: true,
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ message: "Login successful", token, user: { userID: user._id, username: user.username } });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const logoutUser = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Logout successful" });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// may admin ba?
// retrieve all, admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password"); // never send passwords

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving users." });
  }
};

// retrieve own user info
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user." });
  }
};

// retrieve user by id, admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user." });
  }
};

// update info except password
const updateUser = async (req, res) => {
  try {
    const { firstname, lastname, username, email } = req.body;

    const updates = {};
    if (firstname !== undefined) updates.firstname = firstname;
    if (lastname !== undefined) updates.lastname = lastname;
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true, context: 'query' }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(user);

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Username or email already exists." });
    }
    res.status(500).json({ message: "Error updating user." });
  }
};

const updateUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required."
      });
    }

    const user = await User.findById(req.user.id).select("password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error updating password." });
  }
};


// delete
const deleteUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // firebase
    const prefixes = [`users/${userId}/`, `recipes/${userId}/`];
    for (const prefix of prefixes) {
      try {
        const [files] = await bucket.getFiles({ prefix });
        await Promise.all(files.map(f => f.delete()));
      } catch (storageError) {
        console.error(`Error deleting storage files under ${prefix}:`, storageError);
      }
    }

    // mongodb
    await Promise.all([
      IngredientBatch.deleteMany({ userId }),
      Ingredient.deleteMany({ userId }),
      SavedRecipe.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
    ]);

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "User and all related data deleted." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user." });
  }
};

const uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user.id;

    const existingUser = await User.findById(userId).select('avatar');
    if (existingUser?.avatar && existingUser.avatar.includes('storage.googleapis.com')) {
      try {
        await deleteFileFromStorage(existingUser.avatar);
      } catch (deleteError) {
        console.error('Error deleting old avatar:', deleteError);
      }
    }

    const fileName = `users/${userId}/profile-${Date.now()}`;
    const file = bucket.file(fileName);

    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype
      }
    });

    await file.makePublic();

    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

    await User.findByIdAndUpdate(userId, {
      avatar: imageUrl
    });

    res.json({ imageUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Verification token is required." });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Verification link is invalid or has expired." });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ message: "Error verifying email." });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.authProvider !== 'local' || user.emailVerified) {
      return res.status(200).json({ message: "If that email exists and is unverified, a new link has been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyURL = `${frontendURL}/verify-email?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"Castelli Kitchen" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Verify your email address",
      html: `
        <p>Hi ${user.firstname},</p>
        <p>Here is your new email verification link. It expires in 24 hours.</p>
        <p><a href="${verifyURL}">${verifyURL}</a></p>
      `,
    });

    res.status(200).json({ message: "If that email exists and is unverified, a new link has been sent." });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ message: "Error sending verification email." });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(200).json({ message: "If that email exists, a reset link has been sent." });
    }

    if (user.authProvider === 'google') {
      return res.status(400).json({ message: "This account uses Google sign-in. Password reset is not available." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetURL = `${frontendURL}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Castelli Kitchen" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Reset your password",
      html: `
        <p>Hi ${user.firstname},</p>
        <p>You requested a password reset. Click the link below to set a new password. This link expires in 1 hour.</p>
        <p><a href="${resetURL}">${resetURL}</a></p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    res.status(200).json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Error sending reset email." });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired." });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Error resetting password." });
  }
};


export { deleteUser, forgotPassword, getAllUsers, getCurrentUser, getUserById, loginUser, logoutUser, registerUser, resendVerification, resetPassword, updateUser, updateUserPassword, uploadProfilePic, verifyEmail };

