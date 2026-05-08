const { userSessionRepository } = require("../repositories");
const {
  AppError,
  generateTokenPair,
  getSimpleDeviceName,
  hashToken,
  delay,
  generateAccessToken,
  withTransaction,
} = require("../utils/");
const auditService = require("./audit.service");

class SessionService {
  // ----- For Auth Controller ----- //
  async createNewSession({ userId, deviceInfo, transaction = null }) {
    // extract device info
    const { ua, ip } = deviceInfo;
    const deviceName = getSimpleDeviceName(ua);

    // count active sessions for limiting
    const activeSessionsCount = await userSessionRepository.countActiveSessions(
      userId,
      {
        transaction,
      },
    );

    if (activeSessionsCount >= 5) {
      await userSessionRepository.revokeOldestSession(userId, {
        transaction,
      });
    }

    // generate token pair
    const { rawToken, hashedToken } = generateTokenPair();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 hari

    // save session to DB
    const session = await userSessionRepository.createSession(
      {
        userId,
        refreshToken: hashedToken,
        expiresAt,
        ua,
        deviceName,
        ip,
      },
      { transaction },
    );

    return {
      refreshToken: rawToken,
      sessionId: session.id,
      deviceName,
    };
  }

  async refreshSession({ oldRefreshToken, deviceInfo, email }) {
    let refreshError = null;

    const result = await withTransaction(async (transaction) => {
      // Find old session by hashed token
      const hashedToken = hashToken(oldRefreshToken);
      const session = await userSessionRepository.findValidSessionByToken(
        hashedToken,
        { transaction },
      );

      // Validate session
      if (!session) {
        refreshError = { message: "Invalid refresh token", statusCode: 401 };
        return null;
      }

      // if reused token detected (expired or revoked), revoke all sessions for security
      if (session.expiresAt < new Date() || session.revokedAt) {
        const metadata = {
          attemptedSessionId: session.id,
          reason: "Old or revoked refresh token was used",
        };

        await this.revokeAllDevices(
          session.userId,
          email,
          deviceInfo,
          metadata,
          transaction,
        );

        refreshError = {
          message: "Token reused detected",
          statusCode: 401,
        };
        return null;
      }

      // Revoke old session
      await userSessionRepository.revokeSessionById(session.id, {
        transaction,
      });

      // Create new session
      const newSession = await this.createNewSession(
        {
          userId: session.userId,
          deviceInfo,
        },
        { transaction },
      );

      // Generate new access token
      const accessToken = generateAccessToken({
        userId: session.userId,
        sessionId: newSession.sessionId,
      });

      return {
        accessToken,
        refreshToken: newSession.refreshToken,
      };
    });

    if (refreshError) {
      await delay(500); // Optional: Add delay to mitigate brute-force attacks
      throw new AppError(refreshError.message, refreshError.statusCode);
    }

    return result;
  }

  // ----- For Session Controller ----- //
  async getActiveSessions(userId) {
    const sessions = await userSessionRepository.findAllValidSessionsByUserId(
      userId,
      { limit: 5 },
    );
    return { sessions, total: sessions.length };
  }

  async revokeCurrentSession(refreshToken, email) {
    return await withTransaction(async (transaction) => {
      const hashedToken = hashToken(refreshToken);
      const session = await userSessionRepository.findValidSessionByToken(
        hashedToken,
        { transaction },
      );

      if (!session) {
        throw new AppError("Session not found", 404);
      }

      await userSessionRepository.revokeSessionById(session.id, {
        transaction,
      });

      await auditService.record({
        action: "LOGOUT",
        status: "SUCCESS",
        userId: session.userId,
        email,
        ip: session.ip,
        ua: session.ua,
        metadata: { sessionId: session.id },
        transaction,
      });
    });
  }

  async revokeFromDevice(userId, sessionId, email) {
    return await withTransaction(async (transaction) => {
      const session = await userSessionRepository.findSessionById(sessionId, {
        transaction,
      });

      if (!session || session.userId !== userId) {
        throw new AppError("Session not found", 404);
      }

      await userSessionRepository.revokeSessionById(sessionId, {
        transaction,
      });

      await auditService.record({
        action: "LOGOUT FROM DEVICE",
        status: "SUCCESS",
        userId: session.userId,
        email,
        ip: session.ip,
        ua: session.ua,
        metadata: { sessionId: session.id },
        transaction,
      });
    });
  }

  async revokeOtherDevices(
    userId,
    currentSessionId,
    email,
    reason = "User initiated logout from other devices",
  ) {
    return await withTransaction(async (transaction) => {
      const currentSession = await userSessionRepository.findSessionById(
        currentSessionId,
        {
          transaction,
        },
      );
      await userSessionRepository.revokeOtherSessions(
        userId,
        currentSession.refreshToken,
        {
          transaction,
        },
      );

      await auditService.record({
        action: "LOGOUT FROM OTHER DEVICES",
        status: "SUCCESS",
        userId: currentSession.userId,
        email,
        ip: currentSession.ip,
        ua: currentSession.ua,
        metadata: { currentSessionId: currentSession.id, reason },
        transaction,
      });
    });
  }

  async revokeAllDevices(
    userId,
    email,
    deviceInfo,
    metadata = { reason: "User initiated logout from all devices" },
    transaction = null,
  ) {
    // extract device info
    const { ua, ip } = deviceInfo;

    const revokeTransaction = async (t) => {
      await userSessionRepository.revokeAllSessions(userId, {
        t,
      });

      await auditService.record({
        action: "LOGOUT FROM ALL DEVICES",
        status: "SUCCESS",
        userId,
        email,
        ip: ip,
        ua: ua,
        metadata,
        t,
      });
    };

    if (transaction) {
      await revokeTransaction(transaction);
    }

    return await withTransaction(revokeTransaction);
  }
}

module.exports = new SessionService();
