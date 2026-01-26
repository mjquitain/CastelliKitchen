import express from "express";

const app = express();

app.use(express.json());

import savedRecipeRouter from "./routes/savedrecipe.routes.js";
import userRouter from "./routes/user.routes.js";
import recipeRouter from "./routes/recipe.routes.js";
import ingredientRouter from "./routes/ingredient.routes.js";

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/savedrecipes", savedRecipeRouter);
app.use("/api/v1/ingredients", ingredientRouter);

export default app;
