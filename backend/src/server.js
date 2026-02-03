import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initializeScheduler } from "./jobs/scheduler.js";

const PORT = process.env.PORT || 5000;

connectDB();

initializeScheduler();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
