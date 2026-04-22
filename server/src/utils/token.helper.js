const crypto = require('crypto');

/**
 * Helper untuk mengelola Opaque Tokens (Reset Password, Invitation, Verify, dsb)
 */
class TokenHelper {
  /**
   * Generate string acak yang aman (Raw Token)
   */
  generateRandomToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Hash token menggunakan SHA-256
   */
  hashToken(token) {
    if (!token) return null;
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Langsung buat sepasang: Raw untuk dikirim ke User, Hash untuk simpan di DB
   */
  generateTokenPair(bytes = 32) {
    const rawToken = this.generateRandomToken(bytes);
    const hashedToken = this.hashToken(rawToken);
    return { rawToken, hashedToken };
  }

  /**
   * Cek apakah token sudah expired berdasarkan waktu sekarang
   */
  isExpired(expiresAt) {
    return new Date() > new Date(expiresAt);
  }
}

module.exports = new TokenHelper();