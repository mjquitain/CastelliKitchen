import cors from "cors";
import express from "express";

import userRoutes from "./routes/user.routes.js";

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/v1/users", userRoutes);

export default app;
