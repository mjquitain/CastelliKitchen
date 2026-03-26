import { describe, it, expect, vi, beforeEach } from "vitest";
import * as userController from "../../src/controllers/user.controller.js";
import * as userModel from "../../src/models/user.model.js";
import * as ingredientModel from "../../src/models/ingredient.model.js";
import * as ingredientBatchModel from "../../src/models/ingredientbatch.model.js";
import * as savedRecipeModel from "../../src/models/savedrecipe.model.js";
import * as notificationModel from "../../src/models/notification.model.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { bucket } from "../../src/config/firebase.js";
import * as fileUploadUtils from "../../src/utils/fileUpload.js";

vi.mock("nodemailer");
vi.mock("jsonwebtoken");
vi.mock("crypto");
vi.mock("../../src/config/firebase.js", () => ({
  bucket: {
    file: vi.fn(() => ({ save: vi.fn(), makePublic: vi.fn(), name: "file.jpg" })),
    getFiles: vi.fn(),
  },
}));
vi.mock("../../src/utils/fileUpload.js");

describe("User Controller", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, user: { id: "user123" }, file: { buffer: Buffer.from("file"), mimetype: "image/png" } };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    vi.clearAllMocks();

    crypto.randomBytes.mockReturnValue({
      toString: vi.fn(() => "mocked-token"),
    });
  });

  describe("registerUser", () => {
    it("should return 400 if fields missing", async () => {
      req.body = {};
      await userController.registerUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 409 if email exists", async () => {
      req.body = { firstname: "A", lastname: "B", username: "u", password: "Aa!1234", email: "test@example.com" };
      vi.spyOn(userModel.User, "findOne").mockResolvedValue({ email: "test@example.com" });
      await userController.registerUser(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("should create user and send verification email", async () => {
      req.body = {
        firstname: "A",
        lastname: "B",
        username: "u",
        password: "Aa!1234",
        email: "test@example.com"
      };

      vi.spyOn(userModel.User, "findOne").mockResolvedValue(null);

      const saveMock = vi.fn().mockResolvedValue({});
      const createMock = vi.spyOn(userModel.User, "create").mockResolvedValue({
        _id: "user123",
        firstname: "A",
        email: "test@example.com",
        save: saveMock
      });

      const sendMailMock = vi.fn().mockResolvedValue({});
      nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

      await userController.registerUser(req, res);

      expect(createMock).toHaveBeenCalled();
      expect(sendMailMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("loginUser", () => {
    it("should return 404 if user not found", async () => {
      req.body = { email: "test@example.com", password: "pass" };
      vi.spyOn(userModel.User, "findOne").mockResolvedValue(null);
      await userController.loginUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 401 if password invalid", async () => {
      const user = { comparePassword: vi.fn().mockResolvedValue(false), authProvider: "local", emailVerified: true };
      req.body = { email: "test@example.com", password: "pass" };
      vi.spyOn(userModel.User, "findOne").mockResolvedValue(user);
      await userController.loginUser(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 403 if email not verified", async () => {
      const user = { authProvider: "local", emailVerified: false };
      req.body = { email: "test@example.com", password: "pass" };
      vi.spyOn(userModel.User, "findOne").mockResolvedValue(user);
      await userController.loginUser(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should return 200 and token if login success", async () => {
      const user = { _id: "id", username: "u", authProvider: "local", emailVerified: true, comparePassword: vi.fn().mockResolvedValue(true) };
      req.body = { email: "test@example.com", password: "pass" };
      vi.spyOn(userModel.User, "findOne").mockResolvedValue(user);
      jwt.sign.mockReturnValue("jwt-token");

      await userController.loginUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: "jwt-token" }));
    });
  });

  describe("logoutUser", () => {
    it("should return 404 if user not found", async () => {
      req.body = { email: "test@example.com" };
      vi.spyOn(userModel.User, "findOne").mockResolvedValue(null);
      await userController.logoutUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 200 if logout success", async () => {
      req.body = { email: "test@example.com" };
      vi.spyOn(userModel.User, "findOne").mockResolvedValue({ email: "test@example.com" });
      await userController.logoutUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getAllUsers", () => {
    it("should return 200 with users", async () => {
      vi.spyOn(userModel.User, "find").mockReturnValue({ select: vi.fn().mockResolvedValue([{ _id: "id" }]) });
      await userController.getAllUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getCurrentUser", () => {
    it("should return 404 if user not found", async () => {
      vi.spyOn(userModel.User, "findById").mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
      await userController.getCurrentUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 200 if user found", async () => {
      vi.spyOn(userModel.User, "findById").mockReturnValue({ select: vi.fn().mockResolvedValue({ _id: "user123" }) });
      await userController.getCurrentUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getUserById", () => {
    it("should return 404 if not found", async () => {
      vi.spyOn(userModel.User, "findById").mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
      await userController.getUserById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 200 if found", async () => {
      vi.spyOn(userModel.User, "findById").mockReturnValue({ select: vi.fn().mockResolvedValue({ _id: "id" }) });
      await userController.getUserById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("updateUser", () => {
    it("should return 404 if user not found", async () => {
      vi.spyOn(userModel.User, "findByIdAndUpdate").mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
      await userController.updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 200 if update success", async () => {
      vi.spyOn(userModel.User, "findByIdAndUpdate").mockReturnValue({ select: vi.fn().mockResolvedValue({ _id: "id" }) });
      await userController.updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("updateUserPassword", () => {
    it("should return 400 if missing passwords", async () => {
      req.body = {};
      await userController.updateUserPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 401 if current password incorrect", async () => {
      req.body = { currentPassword: "old", newPassword: "New!123" };
      vi.spyOn(userModel.User, "findById").mockReturnValue({ select: vi.fn().mockResolvedValue({ comparePassword: vi.fn().mockResolvedValue(false) }) });
      await userController.updateUserPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 200 if password updated", async () => {
      const saveMock = vi.fn().mockResolvedValue({});
      req.body = { currentPassword: "old", newPassword: "New!123" };
      vi.spyOn(userModel.User, "findById").mockReturnValue({ select: vi.fn().mockResolvedValue({ comparePassword: vi.fn().mockResolvedValue(true), password: "old", save: saveMock }) });
      await userController.updateUserPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteUser", () => {
    it("should delete user and related data", async () => {
      bucket.getFiles.mockResolvedValue([[]]);
      vi.spyOn(ingredientBatchModel.IngredientBatch, "deleteMany").mockResolvedValue({});
      vi.spyOn(ingredientModel.Ingredient, "deleteMany").mockResolvedValue({});
      vi.spyOn(savedRecipeModel.SavedRecipe, "deleteMany").mockResolvedValue({});
      vi.spyOn(notificationModel.Notification, "deleteMany").mockResolvedValue({});
      vi.spyOn(userModel.User, "findByIdAndDelete").mockResolvedValue({ _id: "user123" });

      await userController.deleteUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("uploadProfilePic", () => {
    it("should return 400 if no file", async () => {
      req.file = null;
      await userController.uploadProfilePic(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should upload and update user avatar", async () => {
      const saveMock = vi.fn().mockResolvedValue({});
      const makePublicMock = vi.fn().mockResolvedValue({});
      bucket.file.mockReturnValue({ save: saveMock, makePublic: makePublicMock, name: "profile.jpg" });
      vi.spyOn(userModel.User, "findByIdAndUpdate").mockResolvedValue({});
      await userController.uploadProfilePic(req, res);
      expect(res.json).toHaveBeenCalledWith({ imageUrl: expect.any(String) });
    });
  });

  describe("verifyEmail", () => {
    it("should return 400 if token missing", async () => {
      req.body = {};
      await userController.verifyEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if token invalid", async () => {
      req.body = { token: "token123" };
      vi.spyOn(userModel.User, "findOne").mockResolvedValue(null);
      await userController.verifyEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 200 if email verified", async () => {
      const saveMock = vi.fn().mockResolvedValue({});
      req.body = { token: "token123" };
      vi.spyOn(userModel.User, "findOne").mockResolvedValue({ save: saveMock });
      await userController.verifyEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });


  describe("resendVerification", () => {
    it("should return 400 if email missing", async () => {
      req.body = {};
      await userController.resendVerification(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });


    it("should return 200 if email exists and unverified", async () => {
      req.body = { email: "test@example.com" };

      const mockUser = {
        authProvider: "local",
        emailVerified: false,
        firstname: "A",
        save: vi.fn().mockResolvedValue({}),
      };

      vi.spyOn(userModel.User, "findOne").mockResolvedValue(mockUser);

      const sendMailMock = vi.fn().mockResolvedValue({});
      nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

      await userController.resendVerification(req, res);

      expect(sendMailMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("forgotPassword", () => {
    it("should return 400 if email missing", async () => {
      req.body = {};
      await userController.forgotPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 200 if email exists", async () => {
      const saveMock = vi.fn().mockResolvedValue({});
      req.body = { email: "test@example.com" };
      vi.spyOn(userModel.User, "findOne").mockResolvedValue({ authProvider: "local", firstname: "A", save: saveMock });
      nodemailer.createTransport.mockReturnValue({ sendMail: vi.fn() });
      await userController.forgotPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 200 if email exists", async () => {
      req.body = { email: "test@example.com" };

      const mockUser = {
        authProvider: "local",
        firstname: "A",
        resetToken: Buffer.from("mocktoken"),
        resetTokenExpiry: Date.now() + 10000,
        save: vi.fn().mockResolvedValue({}),
      };

      vi.spyOn(userModel.User, "findOne").mockResolvedValue(mockUser);
      const sendMailMock = vi.fn().mockResolvedValue({});
      nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

      await userController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 if user uses Google", async () => {
      req.body = { email: "test@example.com" };
      vi.spyOn(userModel.User, "findOne").mockResolvedValue({ authProvider: "google" });
      await userController.forgotPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("resetPassword", () => {
    it("should return 400 if token or newPassword missing", async () => {
      req.body = {};
      await userController.resetPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if token invalid", async () => {
      req.body = { token: "t", newPassword: "New!123" };
      vi.spyOn(userModel.User, "findOne").mockResolvedValue(null);
      await userController.resetPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 200 if password reset successful", async () => {
      const saveMock = vi.fn().mockResolvedValue({});
      req.body = { token: "t", newPassword: "New!123" };
      vi.spyOn(userModel.User, "findOne").mockResolvedValue({ save: saveMock });
      await userController.resetPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});