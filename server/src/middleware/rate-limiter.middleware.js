const rateLimit = require("express-rate-limit");
const AppError = require("../utils/app-error.helper");

// 1. Limiter Umum (Untuk semua route)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Menit
  max: 100, // Maksimal 100 request per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new AppError(
        "Too many requests from this IP, please try again later.",
        429,
      ),
    );
  },
});

// 2. Limiter Khusus Auth (Login/Register)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Menit
  max: process.env.NODE_ENV === "test" ? 100 : 5, // Cuma boleh 5x gagal/coba per 15 menit
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new AppError(
        "Too many requests from this IP, please try again later.",
        429,
      ),
    );
  },
});

const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Menit
  max: process.env.NODE_ENV === "test" ? 100 : 10, // Cuma boleh 10x gagal/coba per 15 menit
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new AppError(
        "Too many refresh token requests from this IP, please try again later.",
        429,
      ),
    );
  },
});

module.exports = { globalLimiter, loginLimiter, refreshTokenLimiter };
