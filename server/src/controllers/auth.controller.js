const { authService } = require("../services");

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      console.log("Login attempt with email:", email); // Debugging log
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
