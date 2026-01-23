import express from "express";

const app = express();

app.use(express.json());

import savedRecipeRouter from "./routes/savedrecipe.routes.js";
import userRouter from "./routes/user.routes.js";

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/savedrecipes", savedRecipeRouter);

export default app;
