const userRepository = require("../../../src/repositories/user.repository");
const { User, Role } = require("../../../src/models");

// Mock Sequelize Models
jest.mock("../../../src/models", () => ({
  User: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
  Role: {},
}));

describe("UserRepository", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findByEmail", () => {
    it("should call findOne with correct include and criteria", async () => {
      const email = "test@example.com";
      const mockUser = { id: 1, email, role: { name: "admin" } };

      // Mock implementasi findOne dari Sequelize
      User.findOne.mockResolvedValue(mockUser);

      const result = await userRepository.findByEmail(email);

      // Cek apakah parameter include Role sudah benar (ini inti dari UserRepository)
      expect(User.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email },
          include: [{ model: Role, as: "role" }],
        }),
      );

      expect(result).toEqual(mockUser);
    });
  });

  describe("findByRole", () => {
    it("should call findAll with nested Role where clause", async () => {
      const roleId = 2;
      User.findAll.mockResolvedValue([]);

      await userRepository.findByRole(roleId);

      // Cek apakah include role memiliki filter where roleId yang tepat
      expect(User.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: [
            {
              model: Role,
              as: "role",
              where: { id: roleId },
            },
          ],
        }),
      );
    });
  });

  describe("updateLastLogin", () => {
    it("should call update with current date and transaction options", async () => {
      const userId = "uuid-123";
      const mockOptions = { transaction: "mock-t" };

      // 1. Jalankan fungsi
      await userRepository.updateLastLogin(userId, mockOptions.transaction);

      // 2. Verifikasi: Pastikan User.update (Static) dipanggil, BUKAN findByPk
      expect(User.update).toHaveBeenCalledWith(
        expect.objectContaining({
          lastLogin: expect.any(Date), // Pastikan ada lastLogin dengan value Date
        }),
        expect.objectContaining({
          where: { id: userId },
          transaction: "mock-t",
        }),
      );
    });
  });
});
