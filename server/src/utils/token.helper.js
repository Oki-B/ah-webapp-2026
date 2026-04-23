const crypto = require("crypto");

const generateRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString("hex");
};

/**
 * Hash token menggunakan SHA-256
 */
const hashToken = (token) => {
  if (!token) return null;
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Langsung buat sepasang: Raw untuk dikirim ke User, Hash untuk simpan di DB
 */
const generateTokenPair = (bytes = 32) => {
  const rawToken = generateRandomToken(bytes);
  const hashedToken = hashToken(rawToken);
  return { rawToken, hashedToken };
};

/**
 * Cek apakah token sudah expired berdasarkan waktu sekarang
 */
const isExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

module.exports = {
  generateRandomToken,
  hashToken,
  generateTokenPair,
  isExpired,
};
