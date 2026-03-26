import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import authMiddleware from "../../src/middleware/auth.js";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn()
  }
}));

const mockNext = vi.fn();

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authMiddleware", () => {
  it("returns 401 if no authorization header", async () => {
    const req = { headers: {} };
    const res = mockRes();

    await authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No token provided" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("returns 401 if header does not start with 'Bearer '", async () => {
    const req = { headers: { authorization: "Token abc" } };
    const res = mockRes();

    await authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No token provided" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("calls next() and sets req.user if token is valid", async () => {
    const req = { headers: { authorization: "Bearer validtoken" } };
    const res = mockRes();

    jwt.verify.mockReturnValue({ id: "user123", email: "test@example.com" });

    await authMiddleware(req, res, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith("validtoken", process.env.JWT_SECRET);
    expect(req.user).toEqual({ id: "user123", email: "test@example.com" });
    expect(mockNext).toHaveBeenCalled();
  });

  it("sets req.user without email if email not in token", async () => {
    const req = { headers: { authorization: "Bearer validtoken" } };
    const res = mockRes();

    jwt.verify.mockReturnValue({ id: "user456" });

    await authMiddleware(req, res, mockNext);

    expect(req.user).toEqual({ id: "user456" });
    expect(mockNext).toHaveBeenCalled();
  });

  it("returns 401 if token is invalid", async () => {
    const req = { headers: { authorization: "Bearer badtoken" } };
    const res = mockRes();

    jwt.verify.mockImplementation(() => { throw new Error("invalid") });

    await authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("returns 401 if token is expired", async () => {
    const req = { headers: { authorization: "Bearer expiredtoken" } };
    const res = mockRes();

    const error = new Error("jwt expired");
    error.name = "TokenExpiredError";
    jwt.verify.mockImplementation(() => { throw error });

    await authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token has expired" });
    expect(mockNext).not.toHaveBeenCalled();
  });
});