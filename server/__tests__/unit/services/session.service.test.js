const sessionService = require("../../../src/services/session.service");
const { userSessionRepository } = require("../../../src/repositories");
const {
  generateTokenPair,
  hashToken,
  generateAccessToken,
  AppError,
} = require("../../../src/utils");

// 1. MOCK SEMUA DEPENDENSI
jest.mock("../../../src/repositories");
jest.mock("../../../src/utils/", () => ({
  ...jest.requireActual("../../../src/utils/"), // Gunakan fungsi asli untuk helper ringan
  generateTokenPair: jest.fn(),
  hashToken: jest.fn(),
  generateAccessToken: jest.fn(),
  delay: jest.fn(), // Supaya test tidak lambat nunggu delay(500)
}));

describe("SessionService Unit Test", () => {
  const mockUserId = "user-uuid-123";
  const mockDeviceInfo = { ip: "127.0.0.1", ua: "Mozilla/5.0..." };
  const mockT = { commit: jest.fn(), rollback: jest.fn() }; // Mock transaction object

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createNewSession()", () => {
    it("should revoke oldest session if active sessions count >= 5", async () => {
      // Mock: Anggap user sudah login di 5 perangkat
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

      // Verifikasi: Fungsi revoke dipanggil karena sudah limit
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
    const oldHashedToken = "old-hashed-token";

    it("should throw 401 if session is not found (Invalid Token)", async () => {
      hashToken.mockReturnValue(oldHashedToken);
      userSessionRepository.findValidSessionByToken.mockResolvedValue(null);

      await expect(
        sessionService.refreshSession({
          oldRefreshToken: oldRawToken,
          deviceInfo: mockDeviceInfo,
        }),
      ).rejects.toThrow("Invalid refresh token");
    });

    it("should throw 401 and revoke all devices if token is reused/expired", async () => {
      const mockUserId = "user-999";
      const expiredSession = {
        id: "session-123",
        userId: mockUserId, // Tambahkan ini agar test bisa memverifikasi userId
        expiresAt: new Date(Date.now() - 1000), // Sudah lewat
        revokedAt: null,
      };

      const email = "test@me.com";

      // Mocking repository agar mengembalikan session yang sudah expired
      userSessionRepository.findValidSessionByToken.mockResolvedValue(
        expiredSession,
      );

      // Eksekusi & Expect Throw
      await expect(
        sessionService.refreshSession({
          oldRefreshToken: "some-old-token",
          deviceInfo: mockDeviceInfo,
          email: email,
        }),
      ).rejects.toThrow("Token reused detected");

      // 1. Gunakan toHaveBeenCalledAtLeastOnce atau check call terakhir
      // 2. Sesuaikan key 't' sesuai hasil log error lu
      expect(userSessionRepository.revokeAllSessions).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          t: expect.any(Object), // Gunakan 't' sesuai output error lu
        }),
      );

      // Kalau lu mau mastiin dipanggil minimal sekali tanpa pusing soal urutan:
      expect(userSessionRepository.revokeAllSessions).toHaveBeenCalledWith(
        expect.any(String),
        expect.anything(),
      );
    });

    it("should successfully rotate token for valid session", async () => {
      const validSession = {
        id: "session-123",
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 100000),
      };

      // Mock sequence
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
      });

      expect(result.accessToken).toBe("new-access-token");
      expect(result.refreshToken).toBe("new-raw");
      // Mastiin session lama di-revoke
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
        sessionService.revokeFromDevice(mockUserId, "sid"),
      ).rejects.toThrow("Session not found");
    });

    it("should successfully revoke session", async () => {
      const mySession = { id: "sid", userId: mockUserId };
      userSessionRepository.findSessionById.mockResolvedValue(mySession);

      await sessionService.revokeFromDevice(mockUserId, "sid");

      expect(userSessionRepository.revokeSessionById).toHaveBeenCalledWith(
        "sid",
        expect.any(Object),
      );
    });
  });
});
