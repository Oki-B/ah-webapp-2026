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
  windowMs: 30 * 60 * 1000, // 30 Menit
  max: process.env.NODE_ENV === "test" ? 100 : 5, // Cuma boleh 5x gagal/coba per 30 menit
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

module.exports = { globalLimiter, loginLimiter };
