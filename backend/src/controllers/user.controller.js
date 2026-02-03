import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Ingredient } from "../models/ingredient.model.js";
import { IngredientBatch } from "../models/ingredientbatch.model.js";
import { SavedRecipe } from "../models/savedrecipe.model.js";

const registerUser = async (req, res) => {

    try {
        const { firstname, lastname, username, password, email } = req.body;

        // Validation
        if (!firstname || !lastname || !username || !password || !email) {
            return res.status(400).json({ message: "All fields are required." });
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
            loggedIn: false,
        });

        res.status(201).json({ message: "User registered successfully", userID: newUser._id, username: newUser.username });

    } catch (error) {
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
    const user = await User.findById(req.user._id)
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

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (firstname !== undefined) user.firstname = firstname;
    if (lastname !== undefined) user.lastname = lastname;
    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;

    await user.save();

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

    const user = await User.findById(req.user._id).select("password");
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
    const userId = req.user._id;

    // delete dependent data
    await IngredientBatch.deleteMany({ userId });
    await Ingredient.deleteMany({ userId });
    await Recipe.deleteMany({ userId });

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "User and all related data deleted." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user." });
  }
};


export {
    loginUser, logoutUser, registerUser, getAllUsers, getCurrentUser, getUserById, updateUser, updateUserPassword, deleteUser
};

