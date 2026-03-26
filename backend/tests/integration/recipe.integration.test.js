import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";

import { Recipe } from "../../src/models/recipe.model.js";
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

describe("Integration: recipe routes", () => {
    let token = "";

    beforeEach(async () => {
        const user = await User.create({
            firstname: "Recipe",
            lastname: "Tester",
            username: "recipetester",
            email: "recipe.tester@example.com",
            password: "Secure@123",
            authProvider: "local",
            emailVerified: true,
        });

        token = jwt.sign(
            { id: String(user._id), email: user.email },
            process.env.JWT_SECRET || "test-jwt-secret",
            { expiresIn: "1h" }
        );
    });

    it("creates a recipe when authenticated", async () => {
        const response = await request(app)
            .post("/api/v1/recipes")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Chicken Adobo",
                category: "Chicken",
                area: "Filipino",
                ingredients: ["Chicken", "Soy Sauce", "Vinegar"],
                instructions: "Marinate chicken and simmer until tender and flavorful.",
            });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            name: "Chicken Adobo",
            category: "Chicken",
            area: "Filipino",
        });

        const recipes = await Recipe.find();
        expect(recipes).toHaveLength(1);
    });

    it("rejects recipe creation without token", async () => {
        const response = await request(app).post("/api/v1/recipes").send({
            name: "No Auth Recipe",
            category: "Chicken",
            area: "Filipino",
            ingredients: ["Chicken"],
            instructions: "This should fail due to missing auth token.",
        });

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({ message: "No token provided" });
    });

    it("rejects invalid recipe payload", async () => {
        const response = await request(app)
            .post("/api/v1/recipes")
            .set("Authorization", `Bearer ${token}`)
            .send({
                category: "Chicken",
                area: "Filipino",
                instructions: "Too short",
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid request.");
    });

    it("lists recipes from database", async () => {
        await Recipe.create({
            name: "Recipe A",
            category: "Chicken",
            area: "Filipino",
            ingredients: ["A"],
            instructions: "Instruction text for recipe A.",
        });

        const response = await request(app).get("/api/v1/recipes");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].name).toBe("Recipe A");
    });

    it("gets recipe by id and returns not found when missing", async () => {
        const recipe = await Recipe.create({
            name: "Recipe B",
            category: "Breakfast",
            area: "American",
            ingredients: ["Eggs"],
            instructions: "Cook eggs and serve warm for breakfast.",
        });

        const getExisting = await request(app).get(`/api/v1/recipes/${recipe._id}`);
        expect(getExisting.status).toBe(200);
        expect(getExisting.body.name).toBe("Recipe B");

        const missingId = new mongoose.Types.ObjectId().toString();
        const getMissing = await request(app).get(`/api/v1/recipes/${missingId}`);
        expect(getMissing.status).toBe(404);
        expect(getMissing.body).toMatchObject({ message: "Recipe not found." });
    });

    it("updates recipe successfully and returns 404 for missing recipe", async () => {
        const recipe = await Recipe.create({
            name: "Recipe C",
            category: "Beef",
            area: "American",
            ingredients: ["Beef"],
            instructions: "Cook the beef in a pan until done.",
        });

        const updateExisting = await request(app)
            .put(`/api/v1/recipes/${recipe._id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Recipe C Updated" });

        expect(updateExisting.status).toBe(200);
        expect(updateExisting.body.name).toBe("Recipe C Updated");

        const missingId = new mongoose.Types.ObjectId().toString();
        const updateMissing = await request(app)
            .put(`/api/v1/recipes/${missingId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Missing" });

        expect(updateMissing.status).toBe(404);
        expect(updateMissing.body).toMatchObject({ message: "Recipe not found." });
    });

    it("returns 404 on delete even for existing recipe due owner filter behavior", async () => {
        const recipe = await Recipe.create({
            name: "Recipe D",
            category: "Dessert",
            area: "French",
            ingredients: ["Sugar"],
            instructions: "Mix sugar with other ingredients and bake.",
        });

        const deleteResponse = await request(app)
            .delete(`/api/v1/recipes/${recipe._id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(deleteResponse.status).toBe(404);
        expect(deleteResponse.body.message).toContain("not found");
    });
});