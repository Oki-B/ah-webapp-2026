const jwt = require("jsonwebtoken");
const { authenticate, validateGoogleToken } = require("../../../src/middlewares/auth.middleware");
const { userRepository } = require("../../../src/repositories");
const { AppError, verifyGoogleToken } = require("../../../src/utils");

// 1. MOCKING DEPENDENCIES
jest.mock("jsonwebtoken");
jest.mock("../../../src/repositories");
jest.mock("../../../src/utils", () => ({
  ...jest.requireActual("../../../src/utils"),
  verifyGoogleToken: jest.fn(),
}));

describe("Auth Middleware Unit Test", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      body: {},
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("authenticate()", () => {
    it("should throw 401 if no token is provided", async () => {
      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Authentication token missing");
    });

    it("should throw 401 if token is invalid (JsonWebTokenError)", async () => {
      req.headers.authorization = "Bearer invalid-token";
      jwt.verify.mockImplementation(() => {
        throw { name: "JsonWebTokenError" };
      });

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: "Invalid token",
        statusCode: 401
      }));
    });

    it("should throw 404 if user in token doesn't exist in DB", async () => {
      req.headers.authorization = "Bearer valid-token";
      jwt.verify.mockReturnValue({ id: "user-123" });
      userRepository.findById.mockResolvedValue(null);

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: "User not found",
        statusCode: 404
      }));
    });

    it("should throw 403 if user is inactive", async () => {
      req.headers.authorization = "Bearer valid-token";
      jwt.verify.mockReturnValue({ id: "user-123" });
      userRepository.findById.mockResolvedValue({ id: "user-123", isActive: false });

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: "Account is inactive. Please contact support.",
        statusCode: 403
      }));
    });

    it("should pass and attach user to req if everything is valid", async () => {
      const mockUser = { id: "user-123", email: "test@me.com", isActive: true };
      req.headers.authorization = "Bearer valid-token";
      jwt.verify.mockReturnValue({ id: "user-123" });
      userRepository.findById.mockResolvedValue(mockUser);

      await authenticate(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith(); // Dipanggil tanpa argumen (success)
    });
  });

  describe("validateGoogleToken()", () => {
    it("should throw 400 if google token is missing", async () => {
      req.body.token = null;

      await validateGoogleToken(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: "Google token missing",
        statusCode: 400
      }));
    });

    it("should attach payload to req.googleUser on success", async () => {
      const mockPayload = { email: "google@test.com", name: "Google User" };
      req.body.token = "google-raw-token";
      verifyGoogleToken.mockResolvedValue(mockPayload);

      await validateGoogleToken(req, res, next);

      expect(req.googleUser).toEqual(mockPayload);
      expect(next).toHaveBeenCalled();
    });

    it("should pass error to next if verifyGoogleToken fails", async () => {
      req.body.token = "bad-token";
      const gError = new Error("Invalid Google Token");
      verifyGoogleToken.mockRejectedValue(gError);

      await validateGoogleToken(req, res, next);

      expect(next).toHaveBeenCalledWith(gError);
    });
  });
});