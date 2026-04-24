const jwt = require("jsonwebtoken");
const {
  generateAccessToken,
  verifyAccessToken,
} = require("../../../src/utils/jwt.helper"); // Sesuaikan path-nya

describe("JWT Helper Utility", () => {
  // 1. Setup Mock Secret & Expiry
  const originalEnv = process.env;

  beforeAll(() => {
    process.env.ACCESS_TOKEN_SECRET = "access-secret-test";
    process.env.ACCESS_TOKEN_EXPIRES_IN = "15m";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const mockPayload = { id: "user-123", role: "ADMIN" };

  describe("Access Token Logic", () => {
    test("should generate a valid access token", () => {
      const token = generateAccessToken(mockPayload);
      expect(token).toBeDefined();

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      expect(decoded.id).toBe(mockPayload.id);
      expect(decoded.role).toBe(mockPayload.role);
    });

    test("should verify a valid access token successfully", () => {
      const token = generateAccessToken(mockPayload);
      const verified = verifyAccessToken(token);
      expect(verified.id).toBe(mockPayload.id);
    });

    test("should throw error if access token is invalid/tampered", () => {
      const fakeToken = "this.is.a.fake.token";
      expect(() => verifyAccessToken(fakeToken)).toThrow();
    });
  });

  describe("Token Expiration", () => {
    test("should throw error if token is expired", () => {
      // Kita buat token yang expired-nya 0 detik
      const expiredToken = jwt.sign(
        mockPayload,
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "0s",
        },
      );

      expect(() => verifyAccessToken(expiredToken)).toThrow("jwt expired");
    });
  });
});
