const { AuditLog } = require("../models");
const { getSimpleDeviceName } = require("../utils/");

class AuditService {
  async record({
    action,
    status,
    userId = null,
    email = null,
    ip = "0.0.0.0",
    ua = "unknown",
    deviceName = null, // Opsional, kalau sudah ada kiriman nama cantik
    metadata = {},
    transaction = null,
  }) {
    try {
      // LOGIC: Kalau deviceName kosong tapi ada UA, kita parsing otomatis
      const finalDeviceName =
        deviceName ||
        (ua !== "unknown" ? getSimpleDeviceName(ua) : "Unknown Device");

      const logPayload = {
        ...metadata,
        deviceName: finalDeviceName,
      };

      await AuditLog.create(
        {
          action,
          status,
          userId,
          email,
          ipAddress: ip,
          userAgent: ua,
          reason: metadata.reason || null,
          payload: logPayload,
        },
        { transaction },
      );
    } catch (error) {
      console.error(`[AuditService] Error:`, error.message);
    }
  }
}

module.exports = new AuditService();
