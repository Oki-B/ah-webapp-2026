const ROLES = {
  SUPERADMIN: { id: 1, name: "superadmin" },
  ADMIN: { id: 2, name: "admin" },
  GUEST: { id: 3, name: "guest" },
};

const AUTH = {
  TOKEN: {
    REFRESH_TOKEN_EXPIRES_IN_MS: 30 * 24 * 60 * 60 * 1000, // 30 Hari
    ACCESS_TOKEN_EXPIRES_IN: "15m", // Untuk JWT sign
    MAX_SESSIONS_PER_USER: 5,
  },
  COOKIE: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  },
};

module.exports = { ROLES, AUTH };
