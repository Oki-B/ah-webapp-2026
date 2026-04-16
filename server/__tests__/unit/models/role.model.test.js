const { Role } = require("../../../src/models");
const { sequelize } = require("../../../src/models");

describe("Role Model Unit Test", () => {
  beforeAll(async () => {
    await Role.destroy({ where: {}, truncate: { cascade: true } });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test("should fail if name is NULL", async () => {
    try {
      await Role.create({ name: null });
    } catch (error) {
      expect(error.name).toBe("SequelizeValidationError");
      expect(error.errors.map((e) => e.message)).toContain(
        "Role name is required.",
      );
    }
  });

  test("should enforce UNIQUE role name", async () => {
    await Role.create({ name: "admin" });

    try {
      await Role.create({ name: "admin" });
    } catch (error) {
      expect(error.name).toBe("SequelizeUniqueConstraintError");
      expect(error.errors[0].message).toBe("Role name must be unique.");
    }
  });
});
