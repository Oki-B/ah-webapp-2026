const { AuditLog } = require("../models");
const { getSimpleDeviceName } = require("../utils/");
const geoip = require("geoip-lite");

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

      // LOGIC: Kita juga bisa tambahkan info lokasi berdasarkan IP, ini opsional aja
      const geo = geoip.lookup(ip);

      const locationInfo = geo
        ? {
            city: geo.city,
            country: geo.country,
            region: geo.region,
            timezone: geo.timezone,
            ll: geo.ll,
          }
        : null;

      const logPayload = {
        ...metadata,
        deviceName: finalDeviceName,
        location: locationInfo
          ? `${locationInfo.city}, ${locationInfo.country}`
          : "Unknown Location",
        geo: locationInfo,
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
