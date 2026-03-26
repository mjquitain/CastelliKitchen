import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer;

beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
    process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "test-google-client-id";
    process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "test-google-client-secret";
    process.env.GOOGLE_CALLBACK_URL =
        process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/v1/auth/google/callback";
    process.env.FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || "test-bucket";

    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, { dbName: "castelli-kitchen-integration" });
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});
