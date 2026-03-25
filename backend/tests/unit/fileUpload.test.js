import { describe, it, expect, vi, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { uploadFileToStorage, deleteFileFromStorage, isValidImageFile } from '../../src/utils/fileUpload.js';
import { bucket } from '../../src/config/firebase.js';

// --- Mock uuid (hoisted) ---
vi.mock('uuid', () => ({
  v4: vi.fn()
}));

// --- Mock firebase bucket (hoisted) ---
vi.mock('../../src/config/firebase.js', () => {
  const mockWriteStream = {
    on: vi.fn(),
    end: vi.fn()
  };

  const mockFileInstance = {
    createWriteStream: vi.fn(() => mockWriteStream),
    makePublic: vi.fn(),
    delete: vi.fn()
  };

  const mockBucket = {
    name: 'test-bucket',
    file: vi.fn(() => mockFileInstance)
  };

  return {
    bucket: mockBucket
  };
});

// Typed mocks
const mockUuid = vi.mocked(uuidv4);

describe('File Upload Utils', () => {
  let mockFileInstance;
  let mockWriteStream;

  beforeEach(() => {
    vi.clearAllMocks();

    // Access fresh instances
    mockFileInstance = bucket.file();
    mockWriteStream = mockFileInstance.createWriteStream();

    // Default behaviors
    mockFileInstance.makePublic.mockResolvedValue(undefined);
    mockFileInstance.delete.mockResolvedValue(undefined);

    // Default stream behavior (chainable + async finish)
    mockWriteStream.on.mockImplementation(function (event, handler) {
      if (event === 'finish') {
        setImmediate(handler);
      }
      return this;
    });

    mockWriteStream.end.mockImplementation(() => {});
  });

  // -------------------------
  // uploadFileToStorage
  // -------------------------
  describe('uploadFileToStorage', () => {
    it('uploads file successfully to default (recipes) folder', async () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test')
      };

      mockUuid.mockReturnValueOnce('uuid-123');

      const result = await uploadFileToStorage(file);

      expect(mockUuid).toHaveBeenCalled();

      expect(bucket.file).toHaveBeenCalledWith(
        'recipes/uuid-123-test.jpg'
      );

      expect(mockFileInstance.createWriteStream).toHaveBeenCalledWith({
        metadata: { contentType: 'image/jpeg' }
      });

      expect(mockWriteStream.end).toHaveBeenCalledWith(file.buffer);
      expect(mockFileInstance.makePublic).toHaveBeenCalled();

      expect(result).toBe(
        'https://storage.googleapis.com/test-bucket/recipes/uuid-123-test.jpg'
      );
    });

    it('uploads file to custom folder', async () => {
      const file = {
        originalname: 'avatar.png',
        mimetype: 'image/png',
        buffer: Buffer.from('')
      };

      mockUuid.mockReturnValueOnce('uuid-456');

      await uploadFileToStorage(file, 'profiles');

      expect(bucket.file).toHaveBeenCalledWith(
        'profiles/uuid-456-avatar.png'
      );
    });

    it('rejects on stream error', async () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('')
      };

      mockWriteStream.on.mockImplementation(function (event, handler) {
        if (event === 'error') {
          setImmediate(() => handler(new Error('Stream error')));
        }
        return this;
      });

      await expect(uploadFileToStorage(file))
        .rejects.toThrow('Stream error');
    });

    it('rejects when makePublic fails', async () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('')
      };

      mockUuid.mockReturnValueOnce('uuid-789');

      mockFileInstance.makePublic.mockRejectedValueOnce(
        new Error('Make public failed')
      );

      await expect(uploadFileToStorage(file))
        .rejects.toThrow('Make public failed');
    });
  });

  // -------------------------
  // deleteFileFromStorage
  // -------------------------
  describe('deleteFileFromStorage', () => {
    it('deletes file successfully', async () => {
      const url =
        'https://storage.googleapis.com/test-bucket/recipes/test.jpg';

      await deleteFileFromStorage(url);

      expect(bucket.file).toHaveBeenCalledWith('recipes/test.jpg');
      expect(mockFileInstance.delete).toHaveBeenCalled();
    });

    it('throws error for invalid URL', async () => {
      await expect(
        deleteFileFromStorage('https://example.com/file.jpg')
      ).rejects.toThrow('Invalid file URL');
    });

    it('handles deletion error and logs it', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockFileInstance.delete.mockRejectedValueOnce(
        new Error('Delete failed')
      );

      const url =
        'https://storage.googleapis.com/test-bucket/recipes/test.jpg';

      await expect(deleteFileFromStorage(url))
        .rejects.toThrow('Delete failed');

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // -------------------------
  // isValidImageFile
  // -------------------------
  describe('isValidImageFile', () => {
    it.each([
      ['image/jpeg', true],
      ['image/jpg', true],
      ['image/png', true],
      ['image/webp', true],
      ['image/gif', false],
      ['application/pdf', false],
      ['', false]
    ])('returns %s → %s', (mimetype, expected) => {
      expect(isValidImageFile({ mimetype })).toBe(expected);
    });
  });
});