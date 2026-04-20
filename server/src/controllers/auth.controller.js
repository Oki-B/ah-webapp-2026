const { authService } = require("../services");
const { verifyGoogleIdToken } = require("../utils/google-auth.helper");

class AuthController {
  // Manual login
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      console.log("Login attempt with email:", email); // Debugging log
      const result = await authService.login(email, password, req);
      res.status(200).json({
        status: "success",
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async googleLogin(req, res, next) {
    try {
      const { idToken } = req.body;
      const payload = await verifyGoogleIdToken(idToken);

      const result = await authService.loginGoogle(payload, req);
      res.status(200).json({
        status: "success",
        message: "Login via Google successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
