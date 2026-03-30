import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import multer from "multer";

jest.unstable_mockModule("../../src/utils/fileUpload.js", () => ({
  isValidImageFile: jest.fn()
}));

const { fileFilter, handleMulterError } = await import(
  "../../src/middleware/upload.js"
);

const fileUploadUtils = await import("../../src/utils/fileUpload.js");

const mockNext = jest.fn();

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("upload.js middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fileFilter", () => {
    it("calls cb with true if file is valid image", () => {
      const file = { mimetype: "image/jpeg" };
      const req = {};
      const cb = jest.fn();

      fileUploadUtils.isValidImageFile.mockReturnValue(true);

      fileFilter(req, file, cb);

      expect(fileUploadUtils.isValidImageFile).toHaveBeenCalledWith(file);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it("calls cb with error if file is invalid", () => {
      const file = { mimetype: "application/pdf" };
      const req = {};
      const cb = jest.fn();

      fileUploadUtils.isValidImageFile.mockReturnValue(false);

      fileFilter(req, file, cb);

      const [err, allowed] = cb.mock.calls[0];

      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe(
        "Only image files (JPEG, JPG, PNG, WEBP) are allowed!"
      );
      expect(allowed).toBe(false);
    });
  });

  describe("handleMulterError", () => {
    it("returns 400 for MulterError with LIMIT_FILE_SIZE", () => {
      const req = {};
      const res = mockRes();
      const err = new multer.MulterError("LIMIT_FILE_SIZE");

      handleMulterError(err, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "File is too large. Maximum size is 5MB.",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("returns 400 for other MulterError codes", () => {
      const req = {};
      const res = mockRes();
      const err = new multer.MulterError("UNKNOWN_CODE", "fieldname");

      handleMulterError(err, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: `Upload error: ${err.message}`,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("returns 400 for generic error", () => {
      const req = {};
      const res = mockRes();
      const err = new Error("Generic error");

      handleMulterError(err, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Generic error" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("calls next if no error", () => {
      const req = {};
      const res = mockRes();

      handleMulterError(null, req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});