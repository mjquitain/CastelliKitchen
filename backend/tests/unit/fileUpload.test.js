import { describe, it, expect, beforeEach, jest } from "@jest/globals";


jest.unstable_mockModule("uuid", () => ({
  v4: jest.fn(),
}));

jest.unstable_mockModule("../../src/config/firebase.js", () => {
  const mockWriteStream = {
    on: jest.fn(),
    end: jest.fn(),
  };

  const mockFileInstance = {
    createWriteStream: jest.fn(() => mockWriteStream),
    makePublic: jest.fn(),
    delete: jest.fn(),
  };

  const mockBucket = {
    name: "test-bucket",
    file: jest.fn(() => mockFileInstance),
  };

  return {
    bucket: mockBucket,
  };
});


const { v4: uuidv4 } = await import("uuid");
const { uploadFileToStorage, deleteFileFromStorage, isValidImageFile } =
  await import("../../src/utils/fileUpload.js");
const { bucket } = await import("../../src/config/firebase.js");

const mockUuid = uuidv4;


describe("File Upload Utils", () => {
  let mockFileInstance;
  let mockWriteStream;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFileInstance = bucket.file();
    mockWriteStream = mockFileInstance.createWriteStream();

    mockFileInstance.makePublic.mockResolvedValue(undefined);
    mockFileInstance.delete.mockResolvedValue(undefined);

    mockWriteStream.on.mockImplementation(function (event, handler) {
      if (event === "finish") {
        setImmediate(handler);
      }
      return this;
    });

    mockWriteStream.end.mockImplementation(() => {});
  });

  describe("uploadFileToStorage", () => {
    it("uploads file successfully to default (recipes) folder", async () => {
      const file = {
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from("test"),
      };

      mockUuid.mockReturnValueOnce("uuid-123");

      const result = await uploadFileToStorage(file);

      expect(mockUuid).toHaveBeenCalled();

      expect(bucket.file).toHaveBeenCalledWith(
        "recipes/uuid-123-test.jpg"
      );

      expect(mockFileInstance.createWriteStream).toHaveBeenCalledWith({
        metadata: { contentType: "image/jpeg" },
      });

      expect(mockWriteStream.end).toHaveBeenCalledWith(file.buffer);
      expect(mockFileInstance.makePublic).toHaveBeenCalled();

      expect(result).toBe(
        "https://storage.googleapis.com/test-bucket/recipes/uuid-123-test.jpg"
      );
    });

    it("uploads file to custom folder", async () => {
      const file = {
        originalname: "avatar.png",
        mimetype: "image/png",
        buffer: Buffer.from(""),
      };

      mockUuid.mockReturnValueOnce("uuid-456");

      await uploadFileToStorage(file, "profiles");

      expect(bucket.file).toHaveBeenCalledWith(
        "profiles/uuid-456-avatar.png"
      );
    });

    it("rejects on stream error", async () => {
      const file = {
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from(""),
      };

      mockWriteStream.on.mockImplementation(function (event, handler) {
        if (event === "error") {
          setImmediate(() => handler(new Error("Stream error")));
        }
        return this;
      });

      await expect(uploadFileToStorage(file)).rejects.toThrow(
        "Stream error"
      );
    });

    it("rejects when makePublic fails", async () => {
      const file = {
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from(""),
      };

      mockUuid.mockReturnValueOnce("uuid-789");

      mockFileInstance.makePublic.mockRejectedValueOnce(
        new Error("Make public failed")
      );

      await expect(uploadFileToStorage(file)).rejects.toThrow(
        "Make public failed"
      );
    });
  });

  describe("deleteFileFromStorage", () => {
    it("deletes file successfully", async () => {
      const url =
        "https://storage.googleapis.com/test-bucket/recipes/test.jpg";

      await deleteFileFromStorage(url);

      expect(bucket.file).toHaveBeenCalledWith("recipes/test.jpg");
      expect(mockFileInstance.delete).toHaveBeenCalled();
    });

    it("throws error for invalid URL", async () => {
      await expect(
        deleteFileFromStorage("https://example.com/file.jpg")
      ).rejects.toThrow("Invalid file URL");
    });

    it("handles deletion error and logs it", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockFileInstance.delete.mockRejectedValueOnce(
        new Error("Delete failed")
      );

      const url =
        "https://storage.googleapis.com/test-bucket/recipes/test.jpg";

      await expect(deleteFileFromStorage(url)).rejects.toThrow(
        "Delete failed"
      );

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("isValidImageFile", () => {
    it.each([
      ["image/jpeg", true],
      ["image/jpg", true],
      ["image/png", true],
      ["image/webp", true],
      ["image/gif", false],
      ["application/pdf", false],
      ["", false],
    ])("returns %s → %s", (mimetype, expected) => {
      expect(isValidImageFile({ mimetype })).toBe(expected);
    });
  });
});