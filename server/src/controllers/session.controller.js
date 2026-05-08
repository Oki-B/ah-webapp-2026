const { sessionService } = require("../services/");
const { AUTH } = require("../config/constants");

class SessionController {
  async getSessions(req, res, next) {
    try {
      const { sessions, total } = await sessionService.getActiveSessions(
        req.user.id,
      );

      res.status(200).json({
        status: "success",
        data: {
          sessions,
          total,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies.refresh_token;
      const { email } = req.user || {};

      await sessionService.revokeCurrentSession(refreshToken, email);

      // Clear cookie di client
      res.clearCookie("refresh_token", {
        ...AUTH.COOKIE,
      });

      res.status(200).json({
        status: "success",
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async logoutFromDevice(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { id, email } = req.user;

      await sessionService.revokeFromDevice(id, sessionId, email);
      res.status(200).json({
        status: "success",
        message: "Logged out from device successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async logoutOtherDevices(req, res, next) {
    try {
      const { id, email, sessionId } = req.user;
      console.log("Current Session ID:", sessionId); // Debug: Pastikan sessionId tersedia di req.user
      await sessionService.revokeOtherDevices(id, sessionId, email);

      res.status(200).json({
        status: "success",
        message: "Logged out from other devices successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SessionController();
