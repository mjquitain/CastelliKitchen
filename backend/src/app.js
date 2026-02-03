import cors from "cors";
import express from "express";

const app = express();

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import ingredientRouter from "./routes/ingredient.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import recipeRouter from "./routes/recipe.routes.js";
import savedRecipeRouter from "./routes/savedrecipe.routes.js";
import userRouter from "./routes/user.routes.js";

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/savedrecipes", savedRecipeRouter);
app.use("/api/v1/recipes", recipeRouter)
app.use("/api/v1/ingredients", ingredientRouter);
app.use("/api/v1/notifications", notificationRouter);

export default app;
