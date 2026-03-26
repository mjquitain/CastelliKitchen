import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";

import { User } from "../../src/models/user.model.js";

const mockSendMail = jest.fn();

jest.unstable_mockModule("nodemailer", () => ({
    default: {
        createTransport: jest.fn(() => ({
            sendMail: mockSendMail,
        })),
    },
}));

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

describe("Integration: user routes success and failure scenarios", () => {
    const baseUser = {
        firstname: "Registered",
        lastname: "User",
        username: "registereduser",
        email: "registered.user@example.com",
        password: "Secure@123",
    };

    beforeEach(async () => {
        mockSendMail.mockClear();
        mockSendMail.mockImplementation(async () => ({ messageId: "mock-message-id" }));

        await User.create({
            ...baseUser,
            authProvider: "local",
            emailVerified: true,
        });
    });

    it("registers a new user successfully", async () => {
        const response = await request(app).post("/api/v1/users/register").send({
            firstname: "New",
            lastname: "User",
            username: "newuser",
            email: "new.user@example.com",
            password: "Secure@123",
        });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            message: "Registration successful. Please check your email to verify your account.",
            emailVerificationRequired: true,
        });
        expect(mockSendMail).toHaveBeenCalledTimes(1);

        const createdUser = await User.findOne({ email: "new.user@example.com" });
        expect(createdUser).not.toBeNull();
        if (!createdUser) {
            throw new Error("Expected user to exist after registration");
        }
        expect(createdUser.emailVerified).toBe(false);
        expect(createdUser.emailVerificationToken).toBeTruthy();
    });

    it("rejects registration when required fields are missing", async () => {
        const response = await request(app).post("/api/v1/users/register").send({
            firstname: "OnlyFirstname",
        });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ message: "All fields are required." });
    });

    it("rejects registration with invalid email format", async () => {
        const response = await request(app).post("/api/v1/users/register").send({
            firstname: "Invalid",
            lastname: "Email",
            username: "invalidemailuser",
            email: "not-an-email",
            password: "Secure@123",
        });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ message: "Please enter a valid email address." });
    });

    it("rejects registration with weak password", async () => {
        const response = await request(app).post("/api/v1/users/register").send({
            firstname: "Weak",
            lastname: "Password",
            username: "weakpassuser",
            email: "weak.pass@example.com",
            password: "password",
        });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain("uppercase");
    });

    it("rejects login for unknown user", async () => {
        const response = await request(app).post("/api/v1/users/login").send({
            email: "unknown@example.com",
            password: "Secure@123",
        });

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({ message: "User not found" });
    });

    it("rejects login with invalid credentials", async () => {
        const response = await request(app).post("/api/v1/users/login").send({
            email: baseUser.email,
            password: "WrongPassword@1",
        });

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({ message: "Invalid credentials" });
    });

    it("rejects duplicate registration by email", async () => {
        const response = await request(app).post("/api/v1/users/register").send({
            firstname: "Duplicate",
            lastname: "Email",
            username: "duplicateemailuser",
            email: baseUser.email,
            password: "Secure@123",
        });

        expect(response.status).toBe(409);
        expect(response.body).toMatchObject({ message: "Email already in use." });
    });
});