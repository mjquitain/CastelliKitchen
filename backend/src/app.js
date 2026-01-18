import express from "express";

const app = express();

app.use(express.json());

import userRouter from "./routes/user.routes.js";

// Routes
app.use("/api/v1/users", userRouter);

export default app;
