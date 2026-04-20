
const BaseRepository = require("./base.repository");
const { UserSession } = require("../models");
const { getSimpleDeviceName } = require("../utils"); // Perbaikan destructuring

class UserSessionRepository extends BaseRepository {
  constructor() {
    super(UserSession);
  }

  async createSession({ userId, refreshToken, expiresAt, req }, options = {}) {
    const ua = req.headers["user-agent"] || "";
    const deviceName = getSimpleDeviceName(ua);
    
    // Perbaikan logic IP
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "0.0.0.0";

    return await this.model.create(
      {
        userId,
        refreshToken,
        expiresAt,
        ua,
        deviceName,
        ip,
        // revokedAt defaultnya null dari migration
      },
      options
    );
  }

  async findValidSessionByToken(refreshToken) {
    return await this.model.findOne({
      where: {
        refreshToken,
        revokedAt: null, // Masih aktif
        expiresAt: { [this.Op.gt]: new Date() }, // Belum expired
      },
    });
  }

  async findAllValidSessionsByUserId(userId) {
    return await this.model.findAll({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { [this.Op.gt]: new Date() },
      },
      order: [['createdAt', 'DESC']] // Tambahan biar yang terbaru di atas
    });
  }

  async revokeSessionById(id, options = {}) {
    return await this.model.update(
      { revokedAt: new Date() },
      { 
        where: { id, revokedAt: null }, // Tambah filter biar gak update session yang udah mati
        ...options 
      }
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
}

module.exports = new UserSessionRepository();