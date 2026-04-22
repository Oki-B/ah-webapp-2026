const UAParser = require("ua-parser-js");

// Fungsi murni: Nerima string, balikin nama cantik
// Bisa dipake di Repository/Service
const getSimpleDeviceName = (ua) => {
  if (!ua) return "Unknown Device";

  const parser = new UAParser(ua);
  const browser = parser.getBrowser().name || "Unknown Browser";
  const os = parser.getOS().name || "Unknown OS";

  return `${browser} on ${os}`;
};

// Fungsi ekstraksi: Khusus buat Controller ambil data dari Request
const extractClientInfo = (req) => {
  return {
    ua: req.headers["user-agent"] || "",
    ip:
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "0.0.0.0",
  };
};

module.exports = {
  getSimpleDeviceName,
  extractClientInfo,
};
