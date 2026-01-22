import express from "express";

const app = express();

app.use(express.json());

import userRouter from "./routes/user.routes.js";
import recipeRouter from "./routes/recipe.routes.js";

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/recipes", recipeRouter);

export default app;
