const { userRepository } = require("../repositories");
const {
  comparePassword,
  generateToken,
  withTransaction,
  AppError,
  delay,
} = require("../utils/");

class AuthService {
  async login(email, password) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      await delay(1500);
      throw new AppError("Invalid email or password", 401);
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      await delay(1500);
      throw new AppError("Invalid email or password", 401);
    }

    if (!user.isActive) {
      await delay(1500);
      throw new AppError("Account is inactive. Please contact support.", 403);
    }

    if (!user.isVerified) {
      await delay(1500);
      throw new AppError(
        "Account is not verified. Please check your email.",
        403,
      );
    }

    return await withTransaction(async (transaction) => {
      await userRepository.updateLastLogin(user.id, { transaction });

      const payload = { id: user.id, role: user.role.name };

      const token = generateToken(payload);

      return {
        token,
        user: { id: user.id, email: user.email, role: user.role.name },
      };
    });
  }
}

module.exports = new AuthService();
