const { z } = require('zod');

const loginSchema = z.object({
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
});

module.exports = { loginSchema };