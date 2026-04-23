const { z } = require("zod");

const authSchema = {
  // 1. Schema untuk Login Tradisional
  login: z.object({
    body: z.object({
      email: z
        .string({ required_error: "Email wajib diisi" })
        .trim()
        .min(1, "Email tidak boleh kosong")
        .email("Format email tidak valid"),

      password: z
        .string({ required_error: "Password wajib diisi" })
        .trim()
        .min(1, "Password tidak boleh kosong")
        .min(8, "Password minimal 8 karakter"),
    }),
  }),

  // 2. Schema untuk Google Login
  googleLogin: z.object({
    body: z.object({
      idToken: z
        .string({ required_error: "Google ID Token wajib dikirim" })
        .trim()
        .min(1, "Token tidak boleh kosong"),
    }),
  }),

  // 3. Schema untuk Refresh Token (Opsional: Validasi Cookie)
  refresh: z.object({
    cookies: z.object({
      refreshToken: z
        .string({ required_error: "Refresh token tidak ditemukan" })
        .min(1, "Refresh token kosong"),
    }),
  }),
};

module.exports = authSchema;
