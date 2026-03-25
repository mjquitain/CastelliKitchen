import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";

import { Ingredient } from "../../src/models/ingredient.model.js";
import { IngredientBatch } from "../../src/models/ingredientbatch.model.js";
import { Notification } from "../../src/models/notification.model.js";
import { User } from "../../src/models/user.model.js";

const mockBucket = {
    name: "test-bucket",
    file: () => ({
        save: async () => { },
        makePublic: async () => { },
        name: "mock-file",
    }),
    getFiles: async () => [[]],
};

jest.unstable_mockModule("../../src/config/firebase.js", () => ({
    bucket: mockBucket,
}));

const { default: app } = await import("../../src/app.js");

describe("Integration: ingredient and notification feature flow", () => {
    let userId = "";
    let token = "";

    beforeEach(async () => {
        const user = await User.create({
            firstname: "Feature",
            lastname: "Tester",
            username: "featuretester",
            email: "feature.tester@example.com",
            password: "Secure@123",
            authProvider: "local",
            emailVerified: true,
        });

        userId = String(user._id);
        const jwtSecret = process.env.JWT_SECRET || "test-jwt-secret";
        token = jwt.sign({ id: userId, email: user.email }, jwtSecret, {
            expiresIn: "1h",
        });
    });

    it("requires authentication for ingredient endpoints", async () => {
        const response = await request(app).get("/api/v1/ingredients");

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({ message: "No token provided" });
    });

    it("creates ingredient and batch, then exposes notification unread count", async () => {
        const payload = {
            name: "Egg",
            quantity: "12 pcs",
            category: "Protein",
            dateAdded: "2026-03-01T00:00:00.000Z",
            expiryDate: "2026-03-30T00:00:00.000Z",
        };

        const createResponse = await request(app)
            .post("/api/v1/ingredients")
            .set("Authorization", `Bearer ${token}`)
            .send(payload);

        expect(createResponse.status).toBe(201);
        expect(createResponse.body.ingredient).toMatchObject({
            name: "egg",
            category: payload.category,
        });
        expect(createResponse.body.ingredientBatch).toMatchObject({
            quantity: payload.quantity,
        });

        const ingredientsInDb = await Ingredient.find({ userId });
        const batchesInDb = await IngredientBatch.find({ userId });
        const notificationsInDb = await Notification.find({ userId });

        expect(ingredientsInDb).toHaveLength(1);
        expect(batchesInDb).toHaveLength(1);
        expect(notificationsInDb).toHaveLength(1);

        const listResponse = await request(app)
            .get("/api/v1/ingredients")
            .set("Authorization", `Bearer ${token}`);

        expect(listResponse.status).toBe(200);
        expect(Array.isArray(listResponse.body)).toBe(true);
        expect(listResponse.body).toHaveLength(1);

        const unreadCountResponse = await request(app)
            .get("/api/v1/notifications/unread-count")
            .set("Authorization", `Bearer ${token}`);

        expect(unreadCountResponse.status).toBe(200);
        expect(unreadCountResponse.body).toMatchObject({ count: 1 });
    });

    it("prevents duplicate ingredient batch for same ingredient and expiry date", async () => {
        const payload = {
            name: "Milk",
            quantity: "1L",
            category: "Dairy",
            dateAdded: "2026-03-01T00:00:00.000Z",
            expiryDate: "2026-03-10T00:00:00.000Z",
        };

        const firstResponse = await request(app)
            .post("/api/v1/ingredients")
            .set("Authorization", `Bearer ${token}`)
            .send(payload);

        const secondResponse = await request(app)
            .post("/api/v1/ingredients")
            .set("Authorization", `Bearer ${token}`)
            .send(payload);

        expect(firstResponse.status).toBe(201);
        expect(secondResponse.status).toBe(409);
        expect(secondResponse.body.message).toContain("Ingredient already saved");
    });

    it("filters ingredients by category", async () => {
        await request(app)
            .post("/api/v1/ingredients")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Chicken",
                quantity: "1kg",
                category: "Protein",
                dateAdded: "2026-03-01T00:00:00.000Z",
                expiryDate: "2026-03-15T00:00:00.000Z",
            });

        await request(app)
            .post("/api/v1/ingredients")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Apple",
                quantity: "4 pcs",
                category: "Fruit",
                dateAdded: "2026-03-01T00:00:00.000Z",
                expiryDate: "2026-03-20T00:00:00.000Z",
            });

        const response = await request(app)
            .get("/api/v1/ingredients/category/Protein")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].category).toBe("Protein");
        expect(response.body[0].name).toBe("chicken");
    });

    it("returns 404 when updating a non-existent ingredient", async () => {
        const missingIngredientId = new mongoose.Types.ObjectId().toString();

        const response = await request(app)
            .put(`/api/v1/ingredients/${missingIngredientId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Renamed Ingredient" });

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({ message: "Ingredient not found." });
    });

    it("returns 404 when requesting a missing ingredient batch", async () => {
        const missingIngredientId = new mongoose.Types.ObjectId().toString();
        const missingBatchId = new mongoose.Types.ObjectId().toString();

        const response = await request(app)
            .get(`/api/v1/ingredients/${missingIngredientId}/batches/${missingBatchId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({ message: "Ingredient batch not found." });
    });

    it("allows notification create, mark read, and clear flows", async () => {
        const createResponse = await request(app)
            .post("/api/v1/notifications")
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "ingredient_added",
                message: "Egg was added to your pantry",
                relatedName: "Egg",
            });

        expect(createResponse.status).toBe(201);
        expect(createResponse.body).toHaveProperty("_id");

        const notificationId = createResponse.body._id;

        const markReadResponse = await request(app)
            .patch(`/api/v1/notifications/${notificationId}/read`)
            .set("Authorization", `Bearer ${token}`);

        expect(markReadResponse.status).toBe(200);
        expect(markReadResponse.body.isRead).toBe(true);

        const unreadCountResponse = await request(app)
            .get("/api/v1/notifications/unread-count")
            .set("Authorization", `Bearer ${token}`);

        expect(unreadCountResponse.status).toBe(200);
        expect(unreadCountResponse.body).toMatchObject({ count: 0 });

        const clearResponse = await request(app)
            .delete("/api/v1/notifications")
            .set("Authorization", `Bearer ${token}`);

        expect(clearResponse.status).toBe(200);
        expect(clearResponse.body.message).toContain("cleared");
    });

    it("returns 404 when notification to mark as read does not exist", async () => {
        const missingNotificationId = new mongoose.Types.ObjectId().toString();

        const response = await request(app)
            .patch(`/api/v1/notifications/${missingNotificationId}/read`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({ message: "Notification not found." });
    });
});
