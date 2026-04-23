const { User, Role } = require("../../../src/models");
const bcrypt = require("../../../src/utils");
const { sequelize } = require("../../../src/models");

describe("User Model Unit Test", () => {
  beforeAll(async () => {
    // Clean up table before tests
    await User.destroy({ where: {}, truncate: { cascade: true } });
    await Role.destroy({ where: {}, truncate: { cascade: true } });

    // Create a role for association
    await Role.create({ id: 1, name: "user" });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe("Password Hashing Hook", () => {
    test("should hash password automatically via beforeCreate hook", async () => {
      const plainPassword = "securePassword123";
      const user = await User.create({
        email: "hashing@example.com",
        password: plainPassword,
        roleId: 1,
      });

      expect(user.password).not.toBe(plainPassword);
      const isMatch = await bcrypt.comparePassword(
        plainPassword,
        user.password,
      );
      expect(isMatch).toBe(true);
    });
  });

  describe("Field Validations", () => {
    test("should fail if email is NULL", async () => {
      try {
        await User.create({ email: null, password: "password123", roleId: 1 });
      } catch (error) {
        expect(error.name).toBe("SequelizeValidationError");
        expect(error.errors.map((e) => e.message)).toContain(
          "Email is required.",
        );
      }
    });

    test("should fail if email format is INVALID", async () => {
      try {
        await User.create({
          email: "invalid-email",
          password: "securePassword123",
          roleId: 1,
        });
      } catch (error) {
        expect(error.errors[0].message).toBe(
          "Email must be a valid email address.",
        );
      }
    });

    test("should fail if password is not a strong password", async () => {
      try {
        await User.create({
          email: "short@example.com",
          password: "passwordsample",
          roleId: 1,
        });
      } catch (error) {
        expect(error.errors[0].message).toBe(
          "Password must be at least 12 characters long and include uppercase letters, lowercase letters, and numbers.",
        );
      }
    });

    test("should enforce UNIQUE email constraint", async () => {
      const email = "unique@example.com";
      await User.create({ email, password: "securePassword123", roleId: 1 });

      try {
        await User.create({ email, password: "securePassword123", roleId: 1 });
      } catch (error) {
        expect(error.name).toBe("SequelizeUniqueConstraintError");
        expect(error.errors[0].message).toBe("Email must be unique.");
      }
    });
  });
});
