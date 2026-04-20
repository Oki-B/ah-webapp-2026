const { AuditLog } = require("../models");

class AuditService {
  static async record({
    action,
    status,
    userId = null,
    email = null,
    metadata = {},
    req,
    transaction = null,
  }) {
    try {
      const ipAddress =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.ip ||
        req.connection.remoteAddress ||
        "0.0.0.0";
      const userAgent = req.headers["user-agent"] || "unknown";

      await AuditLog.create(
        {
          action,
          status,
          userId,
          email,
          ipAddress,
          userAgent,
          reason: metadata.reason || null,
          payload: metadata.payload || null,
        },
        { transaction },
      );
    } catch (error) {
      console.error(
        "[AuditService] Failed to record audit log:",
        error.message,
      );
    }
  }
}

module.exports = AuditService;
