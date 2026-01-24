import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

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

export {
    loginUser, logoutUser, registerUser
};

