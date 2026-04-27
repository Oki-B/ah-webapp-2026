const { userRepository } = require("../repositories");
const {
  comparePassword,
  generateAccessToken,
  withTransaction,
  AppError,
  delay,
} = require("../utils/");
const auditService = require("./audit.service");
const sessionService = require("./session.service");

class AuthService {
  async login(email, password, deviceInfo) {
    // Checking lockout status before anything else
    const user = await userRepository.findByEmail(email);
    if (user?.lockoutUntil && user.lockoutUntil > new Date()) {
      const remaining = Math.ceil(
        (user.lockoutUntil - new Date()) / (60 * 1000),
      );
      throw new AppError(
        `Account locked due to multiple failed login attempts. Try again in ${remaining} minutes.`,
        403,
      );
    }

    // Generate response data and handle login logic inside transaction
    let loginError = null;

    // Handle login logic inside transaction to ensure audit log consistency
    const result = await withTransaction(async (transaction) => {
      // handle failed login with centralized function
      const handleFailure = async (reason, status = 401) => {
        if (user) {
          await this._handleFailedLogin(user, transaction);
        }
        await auditService.record({
          action: "LOGIN_LOCAL",
          status: "FAILED",
          email,
          metadata: { reason },
          ip: deviceInfo.ip,
          ua: deviceInfo.ua,
          transaction,
        });
        loginError = { message: reason, status };
        return null;
      };

      if (!user || !user.password)
        await handleFailure("Invalid email or password");

      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) return await handleFailure("Invalid email or password");

      if (!user.isVerified)
        return await handleFailure("Account not verified", 403);

      if (!user.isActive)
        return await handleFailure("Account is inactive", 403);

      // handle successful login
      await userRepository.updateLastLogin(user.id, transaction);
      const sessionData = await this._generateResponse(
        user,
        deviceInfo,
        transaction,
      );

      await auditService.record({
        action: "LOGIN_LOCAL",
        status: "SUCCESS",
        userId: user.id,
        email,
        ua: deviceInfo.ua,
        ip: deviceInfo.ip,
        deviceName: sessionData.deviceName,
        metadata: { sessionId: sessionData.sessionId },
        transaction,
      });

      return {
        accessToken: sessionData.accessToken,
        refreshToken: sessionData.refreshToken,
      };
    });

    if (loginError) {
      // Optional: Tambahkan delay untuk mencegah brute-force
      await delay(1500);
      throw new AppError(loginError.message, loginError.status);
    }

    return result;
  }

  async loginGoogle(googlePayload, deviceInfo) {
    const { sub: googleId, email } = googlePayload;

    return await withTransaction(async (transaction) => {
      // 1. Cari user berdasarkan email
      let user = await userRepository.findByEmail(email, { transaction });

      // Jika user tidak ditemukan (SaaS lu berbasis undangan/registrasi tertutup)
      if (!user) {
        await auditService.record({
          action: "LOGIN_GOOGLE",
          status: "FAILED",
          email,
          metadata: { reason: "User not invited or not registered" },
          ip: deviceInfo.ip,
          ua: deviceInfo.ua,
          transaction,
        });
        throw new AppError("No account associated with this Google email", 401);
      }

      // 2. Cek Status Akun (Verified/Active)
      // Untuk Google Login, isVerified biasanya otomatis true karena email sudah valid dari Google
      if (!user.isActive) {
        await auditService.record({
          action: "LOGIN_GOOGLE",
          status: "FAILED",
          userId: user.id,
          email,
          metadata: { reason: "Account inactive" },
          ip: deviceInfo.ip,
          ua: deviceInfo.ua,
          transaction,
        });
        throw new AppError("Account is inactive. Please contact support.", 403);
      }

      // 3. Link Google ID jika belum ada (First time Google Login)
      if (!user.googleId) {
        await userRepository.update(user.id, { googleId }, { transaction });

        await auditService.record({
          action: "LINK_GOOGLE",
          status: "SUCCESS",
          userId: user.id,
          email,
          ip: deviceInfo.ip,
          ua: deviceInfo.ua,
          metadata: { message: "Linked Google account to existing user" },
          transaction,
        });
      }

      // 4. Update status login & reset failed attempts (jika sebelumnya ada salah password)
      await userRepository.update(
        user.id,
        {
          lastLogin: new Date(),
          failedLoginAttempts: 0,
          lockoutUntil: null,
          isVerified: true, // Pastikan terverifikasi karena Google sudah valid
        },
        { transaction },
      );

      // 5. Generate Session & Tokens (Memanggil SessionService)
      const sessionData = await sessionService.createNewSession(
        user.id,
        deviceInfo,
        transaction,
      );

      // 6. Record Success Audit
      await auditService.record({
        action: "LOGIN_GOOGLE",
        status: "SUCCESS",
        userId: user.id,
        email,
        ip: deviceInfo.ip,
        ua: deviceInfo.ua,
        deviceName: sessionData.deviceName,
        transaction,
      });

      return {
        accessToken: sessionData.accessToken,
        refreshToken: sessionData.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    });
  }

  // ----- Helper Functions ----- //
  async _generateResponse(user, deviceInfo, transaction = null) {
    const { refreshToken, sessionId, deviceName } =
      await sessionService.createNewSession({
        userId: user.id,
        deviceInfo,
        transaction,
      });

    const payload = {
      userId: user.id,
      sessionId,
    };

    const accessToken = generateAccessToken(payload);

    return {
      accessToken,
      refreshToken,
      sessionId,
      deviceName,
    };
  }

  // Centralized function to handle failed login attempts and lockout logic
  async _handleFailedLogin(user, transaction = null) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    const updateData = { failedLoginAttempts: attempts };

    if (attempts >= 5) {
      // Lockout 15 menit jika sudah 5 kali salah
      updateData.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
      updateData.failedLoginAttempts = 0; // Reset counter setelah di-lock
    }

    await userRepository.update(user.id, updateData, { transaction });

    return {
      isLocked: attempts >= 5,
      remainingAttempts: 5 - attempts,
    };
  }
}

module.exports = new AuthService();
