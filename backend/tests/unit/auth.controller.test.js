import { describe, it, expect, beforeEach, jest } from "@jest/globals";

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    sign: jest.fn(),
  },
}));

const jwt = (await import("jsonwebtoken")).default;
const { googleCallback, googleAuthFailed } = await import(
  "../../src/controllers/auth.controller.js"
);

describe('Auth Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        _id: 'user123',
        email: 'test@example.com'
      }
    };

    res = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    process.env.JWT_SECRET = 'test-secret';
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  describe('googleCallback', () => {
    it('should generate token and redirect to frontend callback URL', async () => {
      jwt.sign.mockReturnValue('mocked-token');

      await googleCallback(req, res);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user123', email: 'test@example.com' },
        'test-secret',
        { expiresIn: '7d' }
      );

      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/callback?token=mocked-token'
      );
    });

    it('should use default frontend URL if env is not set', async () => {
      delete process.env.FRONTEND_URL;

      jwt.sign.mockReturnValue('mocked-token');

      await googleCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/callback?token=mocked-token'
      );
    });

    it('should redirect to login with error if jwt.sign throws', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      jwt.sign.mockImplementation(() => {
        throw new Error('JWT error');
      });

      await googleCallback(req, res);

      expect(consoleSpy).toHaveBeenCalled();

      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/login?error=auth_failed'
      );

      consoleSpy.mockRestore();
    });

    it('should handle missing user gracefully', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      req.user = undefined;

      jwt.sign.mockImplementation(() => {
        throw new Error('User undefined');
      });

      await googleCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/login?error=auth_failed'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('googleAuthFailed', () => {
    it('should return 401 with error message', () => {
      googleAuthFailed(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Google authentication failed'
      });
    });
  });
});