const { userRepository } = require("../repositories");
const {
  comparePassword,
  generateToken,
  withTransaction,
} = require("../utils/");

class AuthService {
  async login(email, password) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      throw new Error("Account is inactive. Please contact support.");
    }

    if (!user.isVerified) {
      throw new Error("Account is not verified. Please check your email.");
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
