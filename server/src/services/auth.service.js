const { userRepository } = require("../repositories");
const {
  comparePassword,
  generateToken,
  withTransaction,
  AppError,
  delay,
} = require("../utils/");
const AuditService = require("./audit.service");

class AuthService {
  async login(email, password, req) {
    const user = await userRepository.findByEmail(email);

    if (!user || !user.password) {
      await delay(1500);
      await AuditService.record({
        action: "LOGIN_LOCAL",
        status: "FAILED",
        email,
        metadata: { reason: "User not found or no password" },
        req,
      });
      throw new AppError("Invalid email or password", 401);
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      await delay(1500);
      await AuditService.record({
        action: "LOGIN_LOCAL",
        status: "FAILED",
        email,
        metadata: { reason: "Invalid password" },
        req,
      });
      throw new AppError("Invalid email or password", 401);
    }

    if (!user.isActive) {
      await delay(1500);
      await AuditService.record({
        action: "LOGIN_LOCAL",
        status: "FAILED",
        email,
        metadata: { reason: "Account inactive" },
        req,
      });
      throw new AppError("Account is inactive. Please contact support.", 403);
    }

    if (!user.isVerified) {
      await delay(1500);
      await AuditService.record({
        action: "LOGIN_LOCAL",
        status: "FAILED",
        email,
        metadata: { reason: "Account not verified" },
        req,
      });
      throw new AppError(
        "Account is not verified. Please check your email.",
        403,
      );
    }

    return await withTransaction(async (transaction) => {
      await userRepository.updateLastLogin(user.id, { transaction });

      await AuditService.record({
        action: "LOGIN_LOCAL",
        status: "SUCCESS",
        userId: user.id,
        email,
        req,
        transaction,
      });

      return this._generateResponse(user);
    });
  }

  async loginGoogle(googlePayload, req) {
    const { sub: googleId, email } = googlePayload;
    return await withTransaction(async (transaction) => {
      let user = await userRepository.findByEmail(email, { transaction });

      if (!user) {
        await delay(1500);
        await AuditService.record({
          action: "LOGIN_GOOGLE",
          status: "FAILED",
          email,
          metadata: { reason: "User not invited or not registered" },
          req,
          transaction,
        });
        throw new AppError("No account associated with this Google email", 401);
      }

      if (!user.googleId) {
        await userRepository.update(
          user.id,
          { googleId },
          {
            transaction,
          },
        );
        await AuditService.record({
          action: "LINK_GOOGLE",
          status: "SUCCESS",
          userId: user.id,
          email,
          req,
          transaction,
          metadata: { reason: "Linked Google account to existing user" },
        });
      }

      await userRepository.updateLastLogin(user.id, { transaction });

      await AuditService.record({
        action: "LOGIN_GOOGLE",
        status: "SUCCESS",
        userId: user.id,
        email,
        req,
        transaction,
      });

      return this._generateResponse(user);
    });
  }

  _generateResponse(user) {
    const payload = { id: user.id, role: user.role.name };
    const token = generateToken(payload);
    return {
      token,
      user: { id: user.id, email: user.email, role: user.role.name },
    };
  }
}

module.exports = new AuthService();
