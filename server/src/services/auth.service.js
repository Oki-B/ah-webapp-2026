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

    const triggerFailure = async (reason) => {
      if (user) {
        await this._handleFailedLogin(user);
      }
      await delay(1500);
      await auditService.record({
        action: "LOGIN_LOCAL",
        status: "FAILED",
        email,
        metadata: { reason },
        ip: deviceInfo.ip,
        ua: deviceInfo.ua,
      });
      throw new AppError("Invalid email or password", 401);
    };

    if (!user || !user.password)
      await triggerFailure("User not found or no password set");

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) await triggerFailure("Invalid password");

    if (!user.isVerified) {
      await delay(1500);
      await auditService.record({
        action: "LOGIN_LOCAL",
        status: "FAILED",
        email,
        metadata: { reason: "Account not verified" },
        ip: deviceInfo.ip,
        ua: deviceInfo.ua,
      });
      throw new AppError(
        "Account is not verified. Please check your email.",
        403,
      );
    }

    if (!user.isActive) {
      await delay(1500);
      await auditService.record({
        action: "LOGIN_LOCAL",
        status: "FAILED",
        email,
        metadata: { reason: "Account inactive" },
        ip: deviceInfo.ip,
        ua: deviceInfo.ua,
      });
      throw new AppError("Account is inactive. Please contact support.", 403);
    }

    return await withTransaction(async (transaction) => {
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
        transaction,
      });

      return {
        accessToken: sessionData.token.accessToken,
        refreshToken: sessionData.token.refreshToken,
        user: sessionData.user,
      };
    });
  }

  async loginGoogle(googlePayload, deviceInfo) {
    const { sub: googleId, email } = googlePayload;

    return await withTransaction(async (t) => {
      // 1. Cari user berdasarkan email
      let user = await userRepository.findByEmail(email, { transaction: t });

      // Jika user tidak ditemukan (SaaS lu berbasis undangan/registrasi tertutup)
      if (!user) {
        await auditService.record({
          action: "LOGIN_GOOGLE",
          status: "FAILED",
          email,
          metadata: { reason: "User not invited or not registered" },
          ip: deviceInfo.ip,
          ua: deviceInfo.ua,
          transaction: t,
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
          transaction: t,
        });
        throw new AppError("Account is inactive. Please contact support.", 403);
      }

      // 3. Link Google ID jika belum ada (First time Google Login)
      if (!user.googleId) {
        await userRepository.update(user.id, { googleId }, { transaction: t });

        await auditService.record({
          action: "LINK_GOOGLE",
          status: "SUCCESS",
          userId: user.id,
          email,
          ip: deviceInfo.ip,
          ua: deviceInfo.ua,
          metadata: { message: "Linked Google account to existing user" },
          transaction: t,
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
        { transaction: t },
      );

      // 5. Generate Session & Tokens (Memanggil SessionService)
      const sessionData = await sessionService.createNewSession(
        user.id,
        deviceInfo,
        t,
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
        transaction: t,
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

  async _generateResponse(user, deviceInfo, transaction = null) {
    const { refreshToken, sessionId, deviceName } =
      await sessionService.createNewSession({
        userId: user.id,
        deviceInfo,
        transaction,
      });

    const payload = {
      userId: user.id,
      role: user.role.name,
      sessionId,
    };

    const accessToken = generateAccessToken(payload);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role.name },
      deviceName,
    };
  }

  async _handleFailedLogin(user) {
    // Kita jalankan transaksi kecil di sini khusus untuk update attempts
    return await withTransaction(async (t) => {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updateData = { failedLoginAttempts: attempts };

      if (attempts >= 5) {
        // Lockout 15 menit jika sudah 5 kali salah
        updateData.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
        updateData.failedLoginAttempts = 0; // Reset counter setelah di-lock
      }

      await userRepository.update(user.id, updateData, { transaction: t });

      return {
        isLocked: attempts >= 5,
        remainingAttempts: 5 - attempts,
      };
    });
  }
}

module.exports = new AuthService();
