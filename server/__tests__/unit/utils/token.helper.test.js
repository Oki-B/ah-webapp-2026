const { 
  generateRandomToken, 
  hashToken, 
  generateTokenPair, 
  isExpired 
} = require("../../../src/utils/token.helper");

describe("TokenHelper Unit Test", () => {
  
  describe("generateRandomToken()", () => {
    it("should generate a string with correct length (hex is 2x bytes)", () => {
      const bytes = 32;
      const token = generateRandomToken(bytes);
      
      expect(typeof token).toBe("string");
      // 32 bytes dalam hex string panjangnya harus 64 karakter
      expect(token).toHaveLength(bytes * 2);
    });

    it("should generate different tokens each call", () => {
      const token1 = generateRandomToken();
      const token2 = generateRandomToken();
      
      expect(token1).not.toBe(token2);
    });
  });

  describe("hashToken()", () => {
    it("should return null if token is missing", () => {
      expect(hashToken(null)).toBeNull();
      expect(hashToken(undefined)).toBeNull();
    });

    it("should produce a valid SHA-256 hash (64 characters)", () => {
      const raw = "test-token";
      const hashed = hashToken(raw);
      
      expect(hashed).toHaveLength(64);
      // SHA-256 dari "test-token" harus selalu sama
      expect(hashed).toBe(hashToken(raw)); 
    });

    it("should produce different hashes for different inputs", () => {
      expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
    });
  });

  describe("generateTokenPair()", () => {
    it("should return an object with raw and hashed tokens", () => {
      const pair = generateTokenPair(16);
      
      expect(pair).toHaveProperty("rawToken");
      expect(pair).toHaveProperty("hashedToken");
      expect(pair.rawToken).toHaveLength(32); // 16 bytes * 2
      
      // Pastikan hashedToken adalah hasil hash dari rawToken
      const manualHash = hashToken(pair.rawToken);
      expect(pair.hashedToken).toBe(manualHash);
    });
  });

  describe("isExpired()", () => {
    it("should return true if the date has passed", () => {
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 10); // 10 menit yang lalu
      
      expect(isExpired(pastDate)).toBe(true);
    });

    it("should return false if the date is in the future", () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10); // 10 menit ke depan
      
      expect(isExpired(futureDate)).toBe(false);
    });

    it("should handle string-based dates correctly", () => {
      const futureDateStr = new Date(Date.now() + 10000).toISOString();
      expect(isExpired(futureDateStr)).toBe(false);
    });
  });
});