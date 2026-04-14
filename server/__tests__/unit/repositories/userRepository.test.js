const UserRepository = require("../../../src/repositories/userRepository");
const { User, Role } = require("../../../src/models");

describe("User Repository Unit Test", () => {
  beforeAll(async () => {
    // Setup initial data for testing
    await User.destroy({ where: {}, truncate: { cascade: true } });
    await Role.destroy({ where: {}, truncate: { cascade: true } });
    await Role.create({ id: 1, name: "superadmin" });
    await Role.create({ id: 2, name: "admin" });
  });

  test("should find a user by email with role included", async () => {
    const email = "repo-test@example.com";
    await User.create({
      email,
      password: "Securepassword123",
      roleId: 1,
    });

    const user = await UserRepository.findByEmail(email);

    expect(user).toBeDefined();
    expect(user.email).toBe(email);
    expect(user.role).toBeDefined(); // Memastikan 'include' jalan
    expect(user.role.name).toBe("superadmin");
  });

  test("should return null if user email is not found", async () => {
    const user = await UserRepository.findByEmail("not-found@example.com");
    expect(user).toBeNull();
  });

  test("should find users by role ID", async () => {
    const email1 = "user1@example.com";
    const email2 = "user2@example.com";

    await User.create({
      email: email1,
      password: "Securepassword123",
      roleId: 2,
    });

    await User.create({
      email: email2,
      password: "Securepassword123",
      roleId: 2,
    });

    const users = await UserRepository.findByRole(2);

    expect(users).toHaveLength(2);
    expect(users[0].email).toBe(email1);
    expect(users[1].email).toBe(email2);
  });

  test("should return an empty array if no users found for a role", async () => {
    const users = await UserRepository.findByRole(999); // Role ID yang tidak ada
    expect(users).toEqual([]);
  });
});
