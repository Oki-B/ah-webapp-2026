const sessionService = require("../../../src/services/session.service");
const { userSessionRepository } = require("../../../src/repositories");
const { auditService } = require("../../../src/services");
const {
  generateTokenPair,
  hashToken,
  generateAccessToken,
} = require("../../../src/utils");

// 1. MOCK SEMUA DEPENDENSI
jest.mock("../../../src/repositories");
jest.mock("../../../src/services/audit.service"); // Mock audit service agar tidak error
jest.mock("../../../src/utils/", () => ({
  ...jest.requireActual("../../../src/utils/"),
  generateTokenPair: jest.fn(),
  hashToken: jest.fn(),
  generateAccessToken: jest.fn(),
  delay: jest.fn(), // Supaya test tidak lambat nunggu delay(500)
  // Mock withTransaction supaya langsung menjalankan callback-nya
  withTransaction: jest.fn((callback) =>
    callback({ _transactionObject: true }),
  ),
}));

describe("SessionService Unit Test", () => {
  const mockUserId = "user-uuid-123";
  const mockEmail = "engineer@ah-web.com";
  const mockDeviceInfo = { ip: "127.0.0.1", ua: "Mozilla/5.0..." };
  const mockT = { _transactionObject: true };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createNewSession()", () => {
    it("should revoke oldest session if active sessions count >= 5", async () => {
      userSessionRepository.countActiveSessions.mockResolvedValue(5);
      userSessionRepository.createSession.mockResolvedValue({
        id: "new-session-id",
      });
      generateTokenPair.mockReturnValue({
        rawToken: "raw",
        hashedToken: "hashed",
      });

      await sessionService.createNewSession({
        userId: mockUserId,
        deviceInfo: mockDeviceInfo,
        transaction: mockT,
      });

      expect(userSessionRepository.revokeOldestSession).toHaveBeenCalledWith(
        mockUserId,
        { transaction: mockT },
      );
      expect(userSessionRepository.createSession).toHaveBeenCalled();
    });

    it("should NOT revoke anything if active sessions < 5", async () => {
      userSessionRepository.countActiveSessions.mockResolvedValue(2);
      userSessionRepository.createSession.mockResolvedValue({
        id: "new-session-id",
      });
      generateTokenPair.mockReturnValue({
        rawToken: "raw",
        hashedToken: "hashed",
      });

      await sessionService.createNewSession({
        userId: mockUserId,
        deviceInfo: mockDeviceInfo,
      });

      expect(userSessionRepository.revokeOldestSession).not.toHaveBeenCalled();
    });
  });

  describe("refreshSession()", () => {
    const oldRawToken = "old-raw-token";

    it("should throw 401 if session is not found (Invalid Token)", async () => {
      userSessionRepository.findValidSessionByToken.mockResolvedValue(null);

      await expect(
        sessionService.refreshSession({
          oldRefreshToken: oldRawToken,
          deviceInfo: mockDeviceInfo,
        }),
      ).rejects.toThrow("Invalid refresh token");
    });

    it("should throw 401 and revoke all devices if token is reused/expired", async () => {
      const expiredSession = {
        id: "session-123",
        userId: "user-999",
        expiresAt: new Date(Date.now() - 1000), // Expired
        revokedAt: null,
      };

      userSessionRepository.findValidSessionByToken.mockResolvedValue(
        expiredSession,
      );

      await expect(
        sessionService.refreshSession({
          oldRefreshToken: oldRawToken,
          deviceInfo: mockDeviceInfo,
          email: mockEmail,
        }),
      ).rejects.toThrow("Token reused detected");

      // Verifikasi revokeAllSessions dipanggil dengan key 't' sesuai code lu
      expect(userSessionRepository.revokeAllSessions).toHaveBeenCalledWith(
        "user-999",
        expect.objectContaining({
          t: expect.any(Object),
        }),
      );
    });

    it("should successfully rotate token for valid session", async () => {
      const validSession = {
        id: "session-123",
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: null,
      };

      userSessionRepository.findValidSessionByToken.mockResolvedValue(
        validSession,
      );
      userSessionRepository.countActiveSessions.mockResolvedValue(1);
      userSessionRepository.createSession.mockResolvedValue({
        id: "new-session-id",
      });

      generateTokenPair.mockReturnValue({
        rawToken: "new-raw",
        hashedToken: "new-hashed",
      });
      generateAccessToken.mockReturnValue("new-access-token");

      const result = await sessionService.refreshSession({
        oldRefreshToken: oldRawToken,
        deviceInfo: mockDeviceInfo,
        email: mockEmail,
      });

      expect(result.accessToken).toBe("new-access-token");
      expect(result.refreshToken).toBe("new-raw");
      expect(userSessionRepository.revokeSessionById).toHaveBeenCalledWith(
        validSession.id,
        expect.any(Object),
      );
    });
  });

  describe("revokeFromDevice()", () => {
    it("should throw 404 if session doesn't belong to user", async () => {
      const otherUserSession = { id: "sid", userId: "hacker-id" };
      userSessionRepository.findSessionById.mockResolvedValue(otherUserSession);

      await expect(
        sessionService.revokeFromDevice(mockUserId, "sid", mockEmail),
      ).rejects.toThrow("Session not found");
    });

    it("should successfully revoke session and record audit", async () => {
      const mySession = {
        id: "sid",
        userId: mockUserId,
        ip: "127.0.0.1",
        ua: "Mozilla",
      };
      userSessionRepository.findSessionById.mockResolvedValue(mySession);

      await sessionService.revokeFromDevice(mockUserId, "sid", mockEmail);

      expect(userSessionRepository.revokeSessionById).toHaveBeenCalledWith(
        "sid",
        expect.any(Object),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: "LOGOUT FROM DEVICE" }),
      );
    });
  });

  describe("revokeOtherDevices()", () => {
    it("should revoke all sessions except the current one", async () => {
      const currentSession = {
        id: "current-id",
        userId: mockUserId,
        ip: "127.0.0.1",
      };
      userSessionRepository.findSessionById.mockResolvedValue(currentSession);

      await sessionService.revokeOtherDevices(
        mockUserId,
        "current-id",
        mockEmail,
      );

      expect(userSessionRepository.revokeOtherSessions).toHaveBeenCalledWith(
        mockUserId,
        "current-id",
        expect.any(Object),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: "LOGOUT FROM OTHER DEVICES" }),
      );
    });
  });

  describe("revokeAllDevices()", () => {
    it("should use existing transaction if provided (Baris 151-153)", async () => {
      const customT = { id: "custom-transaction-id" };

      await sessionService.revokeAllDevices(
        mockUserId,
        mockEmail,
        mockDeviceInfo,
        { reason: "Force logout" },
        customT, // Kirim transaction langsung
      );

      // Verifikasi repo dipanggil dengan t yang dikirim, bukan t dari withTransaction
      expect(userSessionRepository.revokeAllSessions).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({ t: customT }),
      );

      // Pastikan audit record juga pakai t yang sama
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ t: customT }),
      );
    });

    it("should create new transaction if none provided (Baris 156)", async () => {
      // Mock withTransaction sudah kita buat untuk return mockT di setup awal
      await sessionService.revokeAllDevices(
        mockUserId,
        mockEmail,
        mockDeviceInfo,
      );

      expect(userSessionRepository.revokeAllSessions).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          t: expect.objectContaining({ _transactionObject: true }),
        }),
      );
    });
  });

  describe("Edge Cases for refreshSession()", () => {
    it("should throw error if session is already revoked (Token Reuse Detection)", async () => {
      const alreadyRevokedSession = {
        id: "session-revoked",
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: new Date(), // SUDAH DI-REVOKE
      };

      userSessionRepository.findValidSessionByToken.mockResolvedValue(
        alreadyRevokedSession,
      );

      // Spy untuk cek apakah revokeAllDevices terpanggil (logic baris 70-80)
      const revokeSpy = jest
        .spyOn(sessionService, "revokeAllDevices")
        .mockResolvedValue();

      await expect(
        sessionService.refreshSession({
          oldRefreshToken: "any-token",
          deviceInfo: mockDeviceInfo,
          email: mockEmail,
        }),
      ).rejects.toThrow("Token reused detected");

      expect(revokeSpy).toHaveBeenCalled();
      revokeSpy.mockRestore();
    });
  });
});
