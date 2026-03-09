import cors from "cors";
import 'dotenv/config';
import express from "express";
import passport from './config/passport.js';
import helmet from "helmet";

const app = express();

// if (process.env.NODE_ENV === "production") {
//     // production
//     app.use(
//         helmet({
//             contentSecurityPolicy: {
//                 directives: {
//                 defaultSrc: ["'self'"],
//                 imgSrc: [
//                     "'self'",
//                     "https://firebasestorage.googleapis.com"
//                 ],
//                 scriptSrc: ["'self'"],
//                 objectSrc: ["'none'"]
//                 }
//             },
//             frameguard: { action: "deny" },
//             referrerPolicy: { policy: "no-referrer" },
//             xssFilter: true,
//             noSniff: true
//         })
//     );
// } else {
//     // dev
//     app.use(
//         helmet({
//             contentSecurityPolicy: false, 
//             xssFilter: true,
//             noSniff: true
//         })
//     );
// }

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

import authRouter from "./routes/auth.routes.js";
import ingredientRouter from "./routes/ingredient.routes.js";
import mealdbRouter from "./routes/mealdb.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import recipeRouter from "./routes/recipe.routes.js";
import savedRecipeRouter from "./routes/savedrecipe.routes.js";
import userRouter from "./routes/user.routes.js";

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/savedrecipes", savedRecipeRouter);
app.use("/api/v1/recipes", recipeRouter)
app.use("/api/v1/ingredients", ingredientRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/mealdb", mealdbRouter);

export default app;
