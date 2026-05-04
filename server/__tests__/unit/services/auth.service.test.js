const authService = require("../../../src/services/auth.service");
const { userRepository } = require("../../../src/repositories");
const sessionService = require("../../../src/services/session.service");
const auditService = require("../../../src/services/audit.service");
const { comparePassword, generateAccessToken, withTransaction, AppError } = require("../../../src/utils");

// 1. MOCK SEMUA DEPENDENSI
jest.mock("../../../src/repositories");
jest.mock("../../../src/services/session.service");
jest.mock("../../../src/services/audit.service");
jest.mock("../../../src/utils/", () => ({
  ...jest.requireActual("../../../src/utils/"), // Gunakan fungsi asli untuk yang lain
  comparePassword: jest.fn(),
  generateAccessToken: jest.fn(),
  withTransaction: jest.fn((callback) => callback("mock-t")), // Mock transaksi agar langsung jalan
  delay: jest.fn(), // Agar test tidak lambat karena nunggu delay()
}));

describe("AuthService Unit Test", () => {
  const mockDeviceInfo = { ip: "127.0.0.1", ua: "Mozilla/5.0" };
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    password: "hashed-password",
    isVerified: true,
    isActive: true,
    role: { name: "user" },
    failedLoginAttempts: 0,
    lockoutUntil: null,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("login()", () => {
    it("should throw error if account is locked", async () => {
      const lockedUser = { 
        ...mockUser, 
        lockoutUntil: new Date(Date.now() + 15 * 60 * 1000) 
      };
      userRepository.findByEmail.mockResolvedValue(lockedUser);

      await expect(authService.login(lockedUser.email, "password123", mockDeviceInfo))
        .rejects.toThrow(AppError);
    });

    it("should throw 401 if password does not match", async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(false); // Password salah

      await expect(authService.login(mockUser.email, "wrong-pass", mockDeviceInfo))
        .rejects.toThrow("Invalid email or password");
      
      // Pastikan audit record mencatat kegagalan
      expect(auditService.record).toHaveBeenCalledWith(expect.objectContaining({
        status: "FAILED",
        metadata: { reason: "Invalid email or password" }
      }));
    });

    it("should successfully login and return tokens", async () => {
      // Setup mock returns
      userRepository.findByEmail.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      generateAccessToken.mockReturnValue("mock-access-token");
      
      sessionService.createNewSession.mockResolvedValue({
        refreshToken: "mock-refresh-token",
        sessionId: "session-abc",
        deviceName: "Desktop"
      });

      const result = await authService.login(mockUser.email, "correct-pass", mockDeviceInfo);

      expect(result).toHaveProperty("accessToken", "mock-access-token");
      expect(result).toHaveProperty("refreshToken", "mock-refresh-token");
      expect(userRepository.updateLastLogin).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalledWith(expect.objectContaining({
        status: "SUCCESS"
      }));
    });
  });

  describe("loginGoogle()", () => {
    it("should throw error if user not found in database (closed system)", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      const googlePayload = { sub: "google-123", email: "unknown@gmail.com" };

      await expect(authService.loginGoogle(googlePayload, mockDeviceInfo))
        .rejects.toThrow("No account associated with this Google email");
    });

    it("should link googleId if user exists but googleId is empty", async () => {
      const userWithoutGoogle = { ...mockUser, googleId: null };
      userRepository.findByEmail.mockResolvedValue(userWithoutGoogle);
      
      sessionService.createNewSession.mockResolvedValue({
        accessToken: "at", refreshToken: "rt", deviceName: "Mobile"
      });

      await authService.loginGoogle({ sub: "google-123", email: userWithoutGoogle.email }, mockDeviceInfo);

      // Cek apakah repository.update dipanggil untuk link Google ID
      expect(userRepository.update).toHaveBeenCalledWith(
        userWithoutGoogle.id,
        expect.objectContaining({ googleId: "google-123" }),
        expect.any(Object)
      );
    });
  });
});