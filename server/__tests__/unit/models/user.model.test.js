const { User, Role, sequelize } = require("../../../src/models");
const { hashPassword } = require("../../../src/utils/");

describe("User Model Integration Test", () => {
  beforeAll(async () => {
    // 1. Bersihkan database sebelum mulai
    // Urutan penting: hapus User dulu baru Role karena User tergantung pada Role
    await User.destroy({ where: {}, truncate: { cascade: true } });
    await Role.destroy({ where: {}, truncate: { cascade: true } });

    // 2. Setup data dasar yang dibutuhkan semua test case
    adminRole = await Role.create({ name: "admin" });
  });

  // OPSIONAL: Jika lu ingin setiap test case (it/test) mulai dari nol
  afterEach(async () => {
    // Hapus semua user setelah setiap 'it', tapi biarkan Role tetap ada
    await User.destroy({ where: {}, truncate: { cascade: true } });
  });

  afterAll(async () => {
    // Tutup koneksi di akhir
    await sequelize.close();
  });

  describe("Password Validation & Hashing", () => {
    it("should fail if password does not meet strength requirements", async () => {
      try {
        await User.create({
          email: "weak@example.com",
          password: "123", // Terlalu pendek & tidak ada simbol/huruf besar
          roleId: adminRole.id,
        });
      } catch (error) {
        expect(error.name).toBe("SequelizeValidationError");
        expect(error.message).toContain(
          "Password must be at least 12 characters long",
        );
      }
    });

    it("should successfully hash password before saving to DB", async () => {
      const plainPassword = "SuperSecretPassword123!";
      const user = await User.create({
        email: "secure@example.com",
        password: plainPassword,
        roleId: adminRole.id,
      });

      // Password di DB tidak boleh sama dengan plain text
      expect(user.password).not.toBe(plainPassword);
      // Panjang hashed password biasanya sekitar 60 karakter (bcrypt)
      expect(user.password.length).toBeGreaterThan(40);
    });

    it("should re-hash password when it is updated", async () => {
      const user = await User.create({
        email: "update@example.com",
        password: "OldPassword123!",
        roleId: adminRole.id,
      });

      const oldHash = user.password;

      // Update password
      user.password = "NewBetterPassword456!";
      await user.save();

      expect(user.password).not.toBe(oldHash);
      expect(user.password.length).toBeGreaterThan(40);
    });
  });

  describe("Field Constraints", () => {
    it("should fail if email is not a valid email format", async () => {
      try {
        await User.create({
          email: "bukan-email",
          password: "ValidPassword123!",
          roleId: adminRole.id,
        });
      } catch (error) {
        expect(error.errors[0].message).toBe(
          "Email must be a valid email address.",
        );
      }
    });

    it("should enforce unique email", async () => {
      const email = "unique@example.com";
      await User.create({
        email,
        password: "ValidPassword123!",
        roleId: adminRole.id,
      });

      try {
        await User.create({
          email,
          password: "AnotherValid123!",
          roleId: adminRole.id,
        });
      } catch (error) {
        expect(error.name).toBe("SequelizeUniqueConstraintError");
      }
    });
  });
});
