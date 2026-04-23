const { authService, sessionService } = require("../services");
const { AUTH } = require("../config/constants");
const { extractClientInfo, verifyGoogleToken } = require("../utils/");

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const deviceInfo = extractClientInfo(req);
      console.log("Device Info:", deviceInfo); // Debugging: Pastikan deviceInfo terisi dengan benar
      const result = await authService.login(email, password, deviceInfo);
      console.log(result);

      // Gunakan spread operator untuk mengambil semua config cookie sekaligus
      res.cookie("refresh_token", result.refreshToken, {
        ...AUTH.COOKIE,
        maxAge: AUTH.TOKEN.REFRESH_TOKEN_EXPIRES_IN_MS,
      });

      return res.status(200).json({
        status: "success",
        message: "Login successful",
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handler untuk Login via Google OAuth
   */
  async googleLogin(req, res, next) {
    try {
      const googlePayload = req.user;
      const deviceInfo = extractClientInfo(req);

      const result = await authService.loginGoogle(googlePayload, deviceInfo);

      res.cookie("refresh_token", result.refreshToken, {
        ...AUTH.COOKIE,
        maxAge: AUTH.TOKEN.REFRESH_TOKEN_EXPIRES_IN_MS,
      });

      return res.status(200).json({
        status: "success",
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const oldRefreshToken = req.cookies.refreshToken;
      const deviceInfo = extractClientInfo(req);

      const result = await sessionService.refreshSession({
        oldRefreshToken,
        deviceInfo,
      });

      // Konsistensi penggunaan constant di refresh token rotation
      res.cookie("refresh_token", result.refreshToken, {
        ...AUTH.COOKIE,
        maxAge: AUTH.TOKEN.REFRESH_TOKEN_EXPIRES_IN_MS,
      });

      return res.status(200).json({
        status: "Token refreshed successfully",
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
