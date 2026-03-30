import { describe, it, expect, beforeEach, jest } from "@jest/globals";

jest.unstable_mockModule("nodemailer", () => ({
  default: {
    createTransport: jest.fn(),
  },
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    sign: jest.fn(),
  },
}));

jest.unstable_mockModule("crypto", () => ({
  default: {
    randomBytes: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/config/firebase.js", () => ({
  bucket: {
    file: jest.fn(() => ({
      save: jest.fn().mockResolvedValue(),
      makePublic: jest.fn().mockResolvedValue(),
      name: "profile.jpg",
    })),
    getFiles: jest.fn().mockResolvedValue([]),
  },
}));

jest.unstable_mockModule("../../src/utils/fileUpload.js", () => ({
  deleteFileFromStorage: jest.fn(),
  uploadFileToStorage: jest.fn(),
  isValidImageFile: jest.fn()
}));



const userController = await import("../../src/controllers/user.controller.js");
const userModel = await import("../../src/models/user.model.js");
const ingredientModel = await import("../../src/models/ingredient.model.js");
const ingredientBatchModel = await import("../../src/models/ingredientbatch.model.js");
const savedRecipeModel = await import("../../src/models/savedrecipe.model.js");
const notificationModel = await import("../../src/models/notification.model.js");
const nodemailer = (await import("nodemailer")).default;
const jwt = (await import("jsonwebtoken")).default;
const crypto = (await import("crypto")).default;
const { bucket } = await import("../../src/config/firebase.js");

describe("User Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { id: "user123" },
      file: { buffer: Buffer.from("file"), mimetype: "image/png" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();

    jest.spyOn(crypto, "randomBytes").mockImplementation(() => Buffer.from("mocked-token"));
  });

  describe("registerUser", () => {
    it("returns 400 if fields missing", async () => {
      req.body = {};
      await userController.registerUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 409 if email exists", async () => {
      req.body = { firstname: "A", lastname: "B", username: "u", password: "Aa!1234", email: "test@example.com" };
      jest.spyOn(userModel.User, "findOne").mockResolvedValue({ email: "test@example.com" });
      await userController.registerUser(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("creates user and sends verification email", async () => {
      req.body = { firstname: "A", lastname: "B", username: "u", password: "Aa!1234", email: "test@example.com" };
      jest.spyOn(userModel.User, "findOne").mockResolvedValue(null);

      const saveMock = jest.fn().mockResolvedValue({});
      const createMock = jest.spyOn(userModel.User, "create").mockResolvedValue({
        _id: "user123",
        firstname: "A",
        email: "test@example.com",
        save: saveMock,
      });

      const sendMailMock = jest.fn().mockResolvedValue({});
      nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

      await userController.registerUser(req, res);

      expect(createMock).toHaveBeenCalled();
      expect(sendMailMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("loginUser", () => {
    it("returns 404 if user not found", async () => {
      req.body = { email: "test@example.com", password: "pass" };
      jest.spyOn(userModel.User, "findOne").mockResolvedValue(null);
      await userController.loginUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 401 if password invalid", async () => {
      const user = { comparePassword: jest.fn().mockResolvedValue(false), authProvider: "local", emailVerified: true };
      req.body = { email: "test@example.com", password: "pass" };
      jest.spyOn(userModel.User, "findOne").mockResolvedValue(user);
      await userController.loginUser(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("returns 403 if email not verified", async () => {
      const user = { authProvider: "local", emailVerified: false };
      req.body = { email: "test@example.com", password: "pass" };
      jest.spyOn(userModel.User, "findOne").mockResolvedValue(user);
      await userController.loginUser(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("returns 200 and token if login successful", async () => {
      const user = {
        _id: "id",
        username: "u",
        authProvider: "local",
        emailVerified: true,
        comparePassword: jest.fn().mockResolvedValue(true),
      };
      req.body = { email: "test@example.com", password: "pass" };
      jest.spyOn(userModel.User, "findOne").mockResolvedValue(user);
      jwt.sign.mockReturnValue("jwt-token");

      await userController.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: "jwt-token" }));
    });
  });

  describe("logoutUser", () => {
    it("returns 404 if user not found", async () => {
      req.body = { email: "test@example.com" };
      jest.spyOn(userModel.User, "findOne").mockResolvedValue(null);
      await userController.logoutUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 200 if logout successful", async () => {
      req.body = { email: "test@example.com" };
      jest.spyOn(userModel.User, "findOne").mockResolvedValue({ email: "test@example.com" });
      await userController.logoutUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getAllUsers", () => {
    it("returns 200 with users", async () => {
      jest.spyOn(userModel.User, "find").mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: "id" }]) });
      await userController.getAllUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getCurrentUser", () => {
    it("returns 404 if user not found", async () => {
      jest.spyOn(userModel.User, "findById").mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      await userController.getCurrentUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 200 if user found", async () => {
      jest.spyOn(userModel.User, "findById").mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: "user123" }) });
      await userController.getCurrentUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getUserById", () => {
    it("returns 404 if user not found", async () => {
      jest.spyOn(userModel.User, "findById").mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      await userController.getUserById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 200 if user found", async () => {
      jest.spyOn(userModel.User, "findById").mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: "id" }) });
      await userController.getUserById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("updateUser", () => {
    it("returns 404 if user not found", async () => {
      jest.spyOn(userModel.User, "findByIdAndUpdate").mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      await userController.updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 200 if update successful", async () => {
      jest.spyOn(userModel.User, "findByIdAndUpdate").mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: "id" }) });
      await userController.updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("updateUserPassword", () => {
    it("returns 400 if missing passwords", async () => {
      req.body = {};
      await userController.updateUserPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 401 if current password incorrect", async () => {
      req.body = { currentPassword: "old", newPassword: "New!123" };
      jest.spyOn(userModel.User, "findById").mockReturnValue({
        select: jest.fn().mockResolvedValue({ comparePassword: jest.fn().mockResolvedValue(false) }),
      });
      await userController.updateUserPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("returns 200 if password updated", async () => {
      const saveMock = jest.fn().mockResolvedValue({});
      req.body = { currentPassword: "old", newPassword: "New!123" };
      jest.spyOn(userModel.User, "findById").mockReturnValue({
        select: jest.fn().mockResolvedValue({ comparePassword: jest.fn().mockResolvedValue(true), password: "old", save: saveMock }),
      });
      await userController.updateUserPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteUser", () => {
    it("deletes user and related data", async () => {
      bucket.getFiles.mockResolvedValue([[]]);
      jest.spyOn(ingredientBatchModel.IngredientBatch, "deleteMany").mockResolvedValue({});
      jest.spyOn(ingredientModel.Ingredient, "deleteMany").mockResolvedValue({});
      jest.spyOn(savedRecipeModel.SavedRecipe, "deleteMany").mockResolvedValue({});
      jest.spyOn(notificationModel.Notification, "deleteMany").mockResolvedValue({});
      jest.spyOn(userModel.User, "findByIdAndDelete").mockResolvedValue({ _id: "user123" });

      await userController.deleteUser(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("uploadProfilePic", () => {
    it("returns 400 if no file", async () => {
      req.file = null;
      await userController.uploadProfilePic(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("uploads and updates user avatar", async () => {
      const saveMock = jest.fn().mockResolvedValue({});
      const makePublicMock = jest.fn().mockResolvedValue({});
      bucket.file.mockReturnValue({ save: saveMock, makePublic: makePublicMock, name: "profile.jpg" });
      jest.spyOn(userModel.User, "findByIdAndUpdate").mockResolvedValue({});
      await userController.uploadProfilePic(req, res);
      expect(res.json).toHaveBeenCalledWith({ imageUrl: expect.any(String) });
    });
  });

  describe("verifyEmail", () => {
    it("returns 400 if token missing", async () => {
      req.body = {};
      await userController.verifyEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 if token invalid", async () => {
      req.body = { token: "token123" };
      jest.spyOn(userModel.User, "findOne").mockResolvedValue(null);
      await userController.verifyEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 200 if email verified", async () => {
      const saveMock = jest.fn().mockResolvedValue({});
      req.body = { token: "token123" };
      jest.spyOn(userModel.User, "findOne").mockResolvedValue({ save: saveMock });
      await userController.verifyEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("resendVerification", () => {
    it("returns 400 if email missing", async () => {
      req.body = {};
      await userController.resendVerification(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 200 if email exists and unverified", async () => {
      req.body = { email: "test@example.com" };
      const mockUser = { authProvider: "local", emailVerified: false, firstname: "A", save: jest.fn().mockResolvedValue({}) };
      jest.spyOn(userModel.User, "findOne").mockResolvedValue(mockUser);
      const sendMailMock = jest.fn().mockResolvedValue({});
      nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

      await userController.resendVerification(req, res);

      expect(sendMailMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("forgotPassword", () => {
    it("returns 400 if email missing", async () => {
      req.body = {};
      await userController.forgotPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 200 if email exists", async () => {
      const saveMock = jest.fn().mockResolvedValue({});
      req.body = { email: "test@example.com" };
      jest.spyOn(userModel.User, "findOne").mockResolvedValue({ authProvider: "local", firstname: "A", save: saveMock });
      nodemailer.createTransport.mockReturnValue({ sendMail: jest.fn() });

      await userController.forgotPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("resetPassword", () => {
    it("returns 400 if token or newPassword missing", async () => {
      req.body = {};
      await userController.resetPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 if token invalid", async () => {
      req.body = { token: "t", newPassword: "New!123" };
      jest.spyOn(userModel.User, "findOne").mockResolvedValue(null);
      await userController.resetPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 200 if password reset successful", async () => {
      const saveMock = jest.fn().mockResolvedValue({});
      req.body = { token: "t", newPassword: "New!123" };
      jest.spyOn(userModel.User, "findOne").mockResolvedValue({ save: saveMock });
      await userController.resetPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});