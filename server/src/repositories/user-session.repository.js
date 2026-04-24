const BaseRepository = require("./base.repository");
const { UserSession } = require("../models");
const { getSimpleDeviceName } = require("../utils");

class UserSessionRepository extends BaseRepository {
  constructor() {
    super(UserSession);
  }

  async createSession(
    { userId, refreshToken, expiresAt, ua, deviceName, ip },
    options = {},
  ) {
    return await this.model.create(
      {
        userId,
        refreshToken,
        expiresAt,
        ua,
        deviceName,
        ip,
      },
      options, // Konsisten: { transaction: t }
    );
  }

  async countActiveSessions(userId, options = {}) {
    return await this.model.count({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { [this.Op.gt]: new Date() },
      },
      ...options,
    });
  }

  async findValidSessionByToken(refreshToken, options = {}) {
    return await this.model.findOne({
      where: {
        refreshToken,
        revokedAt: null,
        expiresAt: { [this.Op.gt]: new Date() },
      },
      ...options,
    });
  }

  async findAllValidSessionsByUserId(userId, options = {}) {
    return await this.model.findAll({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { [this.Op.gt]: new Date() },
      },
      attributes: [
        "id",
        "deviceName",
        "ip",
        "ua",
        "revokedAt",
        "expiresAt",
        "createdAt",
        "lastActivityAt",
      ],
      order: [["createdAt", "DESC"]],
      ...options,
    });
  }

  async findSessionById(id, options = {}) {
    return await this.model.findOne({
      where: { id },
      ...options,
    });
  }

  async updateSessionById(id, data, options = {}) {
    return await this.model.update(data, {
      where: { id },
      ...options,
    });
  }

  // Method baru buat support logic concurrent session limit (max 5)
  async revokeOldestSession(userId, options = {}) {
    // Cari yang paling lama (ASC)
    const oldest = await this.model.findOne({
      where: { userId, revokedAt: null },
      order: [["createdAt", "ASC"]],
      ...options,
    });

    if (oldest) {
      return await oldest.update({ revokedAt: new Date() }, options);
    }
  }

  async revokeSessionById(id, options = {}) {
    return await this.model.update(
      { revokedAt: new Date() },
      {
        where: { id, revokedAt: null },
        ...options,
      },
    );
  }

  async revokeOtherSessions(userId, currentRefreshToken, options = {}) {
    return await this.model.update(
      { revokedAt: new Date() },
      {
        where: {
          userId,
          revokedAt: null,
          refreshToken: { [this.Op.ne]: currentRefreshToken },
        },
        ...options,
      },
    );
  }

  async revokeAllSessions(userId, options = {}) {
    return await this.model.update(
      { revokedAt: new Date() },
      {
        where: { userId, revokedAt: null },
        ...options,
      },
    );
  }
}

module.exports = new UserSessionRepository();
