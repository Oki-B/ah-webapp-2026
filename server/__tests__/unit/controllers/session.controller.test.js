const sessionController = require("../../../src/controllers/session.controller");
const { sessionService } = require("../../../src/services");
const { AUTH } = require("../../../src/config/constants");

// 1. MOCK SERVICE
jest.mock("../../../src/services");

describe("SessionController Unit Test", () => {
  let req, res, next;

  beforeEach(() => {
    // Reset object req, res, dan next untuk setiap test case
    req = {
      user: {
        id: "user-123",
        email: "test@me.com",
        sessionId: "current-sess-id",
      },
      params: {},
      cookies: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("getSessions()", () => {
    it("should return 200 and list of sessions", async () => {
      const mockSessions = {
        sessions: [{ id: "sess-1" }, { id: "sess-2" }],
        total: 2,
      };
      sessionService.getActiveSessions.mockResolvedValue(mockSessions);

      await sessionController.getSessions(req, res, next);

      expect(sessionService.getActiveSessions).toHaveBeenCalledWith("user-123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        data: mockSessions,
      });
    });

    it("should call next(error) if service fails", async () => {
      const error = new Error("DB Error");
      sessionService.getActiveSessions.mockRejectedValue(error);

      await sessionController.getSessions(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getSessions() Error Path", () => {
    it("should call next(error) when getActiveSessions service fails (Line 26)", async () => {
      const error = new Error("Database connection lost");
      // Pakai mockRejectedValue untuk simulasi error dari service
      sessionService.getActiveSessions.mockRejectedValue(error);

      await sessionController.getSessions(req, res, next);

      // Verifikasi bahwa error dilempar ke middleware next
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled(); // Pastikan res.status tidak terpanggil
    });
  });

  describe("logout()", () => {
    it("should revoke current session and clear cookie", async () => {
      req.cookies.refreshToken = "valid-refresh-token";
      sessionService.revokeCurrentSession.mockResolvedValue();

      await sessionController.logout(req, res, next);

      expect(sessionService.revokeCurrentSession).toHaveBeenCalledWith(
        "valid-refresh-token",
        "test@me.com",
      );
      expect(res.clearCookie).toHaveBeenCalledWith("refresh_token", {
        ...AUTH.COOKIE,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle logout when req.user exists", async () => {
      req.user = { email: "test@me.com" };
      req.cookies.refreshToken = "token123";
      sessionService.revokeCurrentSession.mockResolvedValue();

      await sessionController.logout(req, res, next);
      expect(sessionService.revokeCurrentSession).toHaveBeenCalledWith(
        "token123",
        "test@me.com",
      );
    });

    it("should handle logout when req.user is null/undefined (Baris 31 Branch)", async () => {
      req.user = null; // Menembak branch '|| {}'
      req.cookies.refreshToken = "token123";
      sessionService.revokeCurrentSession.mockResolvedValue();

      await sessionController.logout(req, res, next);
      expect(sessionService.revokeCurrentSession).toHaveBeenCalledWith(
        "token123",
        undefined,
      );
    });
  });

  describe("logoutFromDevice()", () => {
    it("should revoke specific session using params.sessionId", async () => {
      req.params.sessionId = "target-sess-id";
      sessionService.revokeFromDevice.mockResolvedValue();

      await sessionController.logoutFromDevice(req, res, next);

      expect(sessionService.revokeFromDevice).toHaveBeenCalledWith(
        "user-123",
        "target-sess-id",
        "test@me.com",
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Logged out from device successfully",
        }),
      );
    });
  });

  describe("logoutOtherDevices()", () => {
    it("should revoke all sessions except the current one from req.user", async () => {
      sessionService.revokeOtherDevices.mockResolvedValue();

      await sessionController.logoutOtherDevices(req, res, next);

      expect(sessionService.revokeOtherDevices).toHaveBeenCalledWith(
        "user-123",
        "current-sess-id",
        "test@me.com",
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Logged out from other devices successfully",
        }),
      );
    });

    it("should handle error in logoutOtherDevices", async () => {
      const error = new Error("Revoke failed");
      sessionService.revokeOtherDevices.mockRejectedValue(error);

      await sessionController.logoutOtherDevices(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("Error Handling", () => {
    it("should call next(error) when logout service fails", async () => {
      const error = new Error("Logout Service Error");
      sessionService.revokeCurrentSession.mockRejectedValue(error);

      // req.cookies.refreshToken harus ada supaya tidak error di level destrukturisasi
      req.cookies.refreshToken = "some-token";

      await sessionController.logout(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it("should call next(error) when logoutFromDevice service fails", async () => {
      const error = new Error("Revoke Device Error");
      sessionService.revokeFromDevice.mockRejectedValue(error);

      req.params.sessionId = "any-id";

      await sessionController.logoutFromDevice(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
