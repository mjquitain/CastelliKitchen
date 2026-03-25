import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import request from "supertest";

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

describe("Integration: authentication routes and auth middleware", () => {
    const credentials = {
        firstname: "Test",
        lastname: "User",
        username: "testuser",
        email: "test.user@example.com",
        password: "Secure@123",
    };

    beforeEach(async () => {
        await User.create({
            ...credentials,
            authProvider: "local",
            emailVerified: true,
        });
    });

    it("logs in successfully and returns a JWT token", async () => {
        const response = await request(app).post("/api/v1/users/login").send({
            email: credentials.email,
            password: credentials.password,
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("token");
        expect(response.body).toMatchObject({
            message: "Login successful",
            user: {
                username: credentials.username,
            },
        });
    });

    it("blocks protected route access when no token is provided", async () => {
        const response = await request(app).get("/api/v1/users/some-id/profile");

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({ message: "No token provided" });
    });

    it("returns current user profile when a valid token is provided", async () => {
        const loginResponse = await request(app).post("/api/v1/users/login").send({
            email: credentials.email,
            password: credentials.password,
        });

        const token = loginResponse.body.token;

        const response = await request(app)
            .get("/api/v1/users/placeholder-id/profile")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.email).toBe(credentials.email);
        expect(response.body).not.toHaveProperty("password");
    });

    it("returns 401 for an invalid JWT token", async () => {
        const response = await request(app)
            .get("/api/v1/users/placeholder-id/profile")
            .set("Authorization", "Bearer invalid.token.value");

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({ message: "Invalid token" });
    });

    it("returns 401 when token has expired", async () => {
        const expiredToken = jwt.sign(
            { id: "507f1f77bcf86cd799439011" },
            process.env.JWT_SECRET || "test-jwt-secret",
            { expiresIn: -1 }
        );

        const response = await request(app)
            .get("/api/v1/users/placeholder-id/profile")
            .set("Authorization", `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({ message: "Token has expired" });
    });
});
