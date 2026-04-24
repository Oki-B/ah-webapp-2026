const user = require("../models/user");
const { userSessionRepository } = require("../repositories");
const {
  AppError,
  generateTokenPair,
  getSimpleDeviceName,
  hashToken,
  delay,
  generateAccessToken,
} = require("../utils/");

class SessionService {
  async createNewSession({ userId, deviceInfo, transaction }) {
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

  async refreshSession({ oldRefreshToken, deviceInfo, transaction }) {
    // Find old session by hashed token
    const hashedToken = hashToken(oldRefreshToken);
    const session = await userSessionRepository.findValidSessionByToken(
      hashedToken,
      { transaction },
    );

    // Validate session
    if (!session) {
      await delay(500); // Tambahkan delay untuk mitigasi brute-force
      throw new AppError("Invalid refresh token", 401);
    }

    // if reused token detected (expired or revoked), revoke all sessions for security
    if (session.expiresAt < new Date() || session.revokedAt) {
      await userSessionRepository.revokeSessionById(session.id, {
        transaction,
      });
      await delay(500); // Tambahkan delay untuk mitigasi brute-force
      throw new AppError("Token reused detected", 401);
    }

    // Revoke old session
    await userSessionRepository.revokeSessionById(session.id, { transaction });

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
  }

  async getActiveSessions(userId) {
    const sessions = await userSessionRepository.findAllValidSessionsByUserId(
      userId,
      { limit: 5 },
    );
    return { sessions, total: sessions.length };
  }

  async revokeCurrentSession(refreshToken, transaction) {
    const hashedToken = hashToken(refreshToken);
    const session = await userSessionRepository.findValidSessionByToken(
      hashedToken,
      { transaction },
    );

    if (!session) {
      throw new AppError("Session not found", 404);
    }

    await userSessionRepository.revokeSessionById(session.id, { transaction });
  }

  async revokeFromDevice(userId, sessionId, transaction) {
    const session = await userSessionRepository.findSessionById(sessionId, {
      transaction,
    });

    if (!session || session.userId !== userId) {
      throw new AppError("Session not found", 404);
    }

    await userSessionRepository.revokeSessionById(sessionId, {
      transaction,
    });
  }

  async revokeOtherDevices(userId, currentSessionId, transaction) {
    await userSessionRepository.revokeOtherSessions(userId, currentSessionId, {
      transaction,
    });
  }

  async revokeAllDevices(userId, transaction) {
    await userSessionRepository.revokeAllSessions(userId, {
      transaction,
    });
  }
}

module.exports = new SessionService();
