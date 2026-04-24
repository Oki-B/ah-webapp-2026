const UserSessionRepository = require("../../../src/repositories/user-session.repository");
const { UserSession } = require("../../../src/models");
const { Op } = require("sequelize");

// Mocking the Model
jest.mock("../../../src/models", () => ({
  UserSession: {
    create: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
}));

describe("UserSessionRepository Unit Test", () => {
  const mockUserId = "user-uuid-123";
  const mockToken = "refresh-token-abc";

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createSession", () => {
    it("should create session with correct device name", async () => {
      const mockInput = {
        userId: "uuid-123",
        refreshToken: "token-abc",
        expiresAt: new Date(Date.now() + 10000),
        ua: "Mozilla/5.0...", // ini yang bakal diolah helper kalau lu panggil di controller
        deviceName: "Chrome on MacOS",
        ip: "127.0.0.1",
      };

      await UserSessionRepository.createSession(mockInput);

      expect(UserSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "uuid-123",
          deviceName: "Chrome on MacOS",
          ip: "127.0.0.1",
          refreshToken: "token-abc",
        }),
        {}, // options/transaction
      );
    });
  });

  describe("countActiveSessions", () => {
    it("should count sessions that are not revoked and not expired", async () => {
      await UserSessionRepository.countActiveSessions(mockUserId);

      expect(UserSession.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: mockUserId,
            revokedAt: null,
            expiresAt: { [Op.gt]: expect.any(Date) },
          },
        }),
      );
    });
  });

  describe("revokeOldestSession", () => {
    it("should find the oldest session and update its revokedAt field", async () => {
      // Mock findOne untuk mengembalikan objek yang punya method update (instance)
      const mockSessionInstance = {
        update: jest.fn().mockResolvedValue(true),
      };
      UserSession.findOne.mockResolvedValue(mockSessionInstance);

      await UserSessionRepository.revokeOldestSession(mockUserId);

      // Pastikan cari yang paling lama (ASC)
      expect(UserSession.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId, revokedAt: null },
          order: [["createdAt", "ASC"]],
        }),
      );

      // Pastikan instance-nya diupdate
      expect(mockSessionInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({ revokedAt: expect.any(Date) }),
        {},
      );
    });

    it("should do nothing if no session is found", async () => {
      UserSession.findOne.mockResolvedValue(null);
      const result =
        await UserSessionRepository.revokeOldestSession(mockUserId);
      expect(result).toBeUndefined();
    });
  });

  describe("revokeOtherSessions", () => {
    it("should revoke all sessions except the current one using Op.ne", async () => {
      const currentToken = "active-token";

      await UserSessionRepository.revokeOtherSessions(mockUserId, currentToken);

      expect(UserSession.update).toHaveBeenCalledWith(
        { revokedAt: expect.any(Date) },
        {
          where: {
            userId: mockUserId,
            revokedAt: null,
            refreshToken: { [Op.ne]: currentToken },
          },
        },
      );
    });
  });

  describe("findAllValidSessionsByUserId", () => {
    it("should return sessions with specific attributes and descending order", async () => {
      await UserSessionRepository.findAllValidSessionsByUserId(mockUserId);

      const callArgs = UserSession.findAll.mock.calls[0][0];

      expect(callArgs.attributes).toContain("deviceName");
      expect(callArgs.attributes).toContain("lastActivityAt");
      expect(callArgs.order).toEqual([["createdAt", "DESC"]]);
    });
  });
});
