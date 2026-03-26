import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { googleCallback, googleAuthFailed } from '../../src/controllers/auth.controller.js';

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn()
  }
}));

describe('Auth Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: {
        _id: 'user123',
        email: 'test@example.com'
      }
    };

    res = {
      redirect: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
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
      const consoleSpy = vi
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
      const consoleSpy = vi
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