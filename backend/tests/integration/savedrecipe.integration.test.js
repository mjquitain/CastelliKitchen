import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";

import { SavedRecipe } from "../../src/models/savedrecipe.model.js";
import { User } from "../../src/models/user.model.js";

const mockBucket = {
    name: "test-bucket",
    file: () => ({
        save: async () => { },
        makePublic: async () => { },
        name: "mock-file",
        createWriteStream: () => ({
            on: () => { },
            end: () => { },
        }),
    }),
    getFiles: async () => [[]],
};

jest.unstable_mockModule("../../src/config/firebase.js", () => ({
    bucket: mockBucket,
}));

const { default: app } = await import("../../src/app.js");

describe("Integration: saved-recipe routes", () => {
    let token = "";
    let userId = "";

    beforeEach(async () => {
        const user = await User.create({
            firstname: "Saved",
            lastname: "Tester",
            username: "savedtester",
            email: "saved.tester@example.com",
            password: "Secure@123",
            authProvider: "local",
            emailVerified: true,
        });

        userId = String(user._id);
        token = jwt.sign(
            { id: userId, email: user.email },
            process.env.JWT_SECRET || "test-jwt-secret",
            { expiresIn: "1h" }
        );
    });

    it("saves recipe and prevents duplicate save", async () => {
        const payload = {
            apiRecipeId: "meal-123",
            title: "Saved Recipe 1",
            category: "Beef",
            ingredients: ["Beef", "Salt"],
            instructions: "Cook and serve.",
            isFavorite: false,
        };

        const first = await request(app)
            .post("/api/v1/savedrecipes")
            .set("Authorization", `Bearer ${token}`)
            .send(payload);

        const second = await request(app)
            .post("/api/v1/savedrecipes")
            .set("Authorization", `Bearer ${token}`)
            .send(payload);

        expect(first.status).toBe(201);
        expect(first.body).toMatchObject({
            apiRecipeId: payload.apiRecipeId,
            title: payload.title,
        });

        expect(second.status).toBe(409);
        expect(second.body.message).toContain("already saved");
    });

    it("rejects invalid ingredients JSON string", async () => {
        const response = await request(app)
            .post("/api/v1/savedrecipes")
            .set("Authorization", `Bearer ${token}`)
            .send({
                apiRecipeId: "meal-456",
                title: "Bad Recipe",
                ingredients: "not-valid-json",
            });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ message: "Invalid ingredients format" });
    });

    it("gets saved recipes and favorites", async () => {
        await SavedRecipe.create({
            userId,
            apiRecipeId: "meal-fav",
            title: "Favorite Recipe",
            isFavorite: true,
        });

        await SavedRecipe.create({
            userId,
            apiRecipeId: "meal-normal",
            title: "Normal Recipe",
            isFavorite: false,
        });

        const savedResponse = await request(app)
            .get("/api/v1/savedrecipes")
            .set("Authorization", `Bearer ${token}`);

        const favoritesResponse = await request(app)
            .get("/api/v1/savedrecipes/favorites")
            .set("Authorization", `Bearer ${token}`);

        expect(savedResponse.status).toBe(200);
        expect(savedResponse.body).toHaveLength(2);

        expect(favoritesResponse.status).toBe(200);
        expect(favoritesResponse.body).toHaveLength(1);
        expect(favoritesResponse.body[0].title).toBe("Favorite Recipe");
    });

    it("toggles favorite status and handles missing recipe", async () => {
        const saved = await SavedRecipe.create({
            userId,
            apiRecipeId: "meal-toggle",
            title: "Toggle Recipe",
            isFavorite: false,
        });

        const toggleExisting = await request(app)
            .patch(`/api/v1/savedrecipes/favorites/${saved._id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(toggleExisting.status).toBe(200);
        expect(toggleExisting.body.isFavorite).toBe(true);

        const missingId = new mongoose.Types.ObjectId().toString();
        const toggleMissing = await request(app)
            .patch(`/api/v1/savedrecipes/favorites/${missingId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(toggleMissing.status).toBe(404);
        expect(toggleMissing.body).toMatchObject({ message: "Recipe not found." });
    });

    it("updates saved recipe and rejects bad ingredient payload", async () => {
        const saved = await SavedRecipe.create({
            userId,
            apiRecipeId: "meal-update",
            title: "Original Title",
            isFavorite: false,
        });

        const updateOk = await request(app)
            .put(`/api/v1/savedrecipes/${saved._id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Updated Title",
                ingredients: JSON.stringify(["Egg", "Salt"]),
            });

        expect(updateOk.status).toBe(200);
        expect(updateOk.body.title).toBe("Updated Title");

        const updateBad = await request(app)
            .put(`/api/v1/savedrecipes/${saved._id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ ingredients: "bad-json" });

        expect(updateBad.status).toBe(400);
        expect(updateBad.body).toMatchObject({ message: "Invalid ingredients format" });
    });

    it("deletes saved recipe and returns 404 for missing recipe", async () => {
        const saved = await SavedRecipe.create({
            userId,
            apiRecipeId: "meal-delete",
            title: "Delete Recipe",
            isFavorite: false,
        });

        const deleteExisting = await request(app)
            .delete(`/api/v1/savedrecipes/${saved._id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(deleteExisting.status).toBe(200);
        expect(deleteExisting.body.message).toContain("deleted");

        const deleteMissing = await request(app)
            .delete(`/api/v1/savedrecipes/${saved._id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(deleteMissing.status).toBe(404);
        expect(deleteMissing.body).toMatchObject({ message: "Recipe not found." });
    });
});