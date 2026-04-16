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
      const userId = 1;
      const mockOptions = { transaction: "mock-t" };

      // 1. Buat Mock Function untuk update milik instance
      const mockUpdateInstance = jest.fn().mockResolvedValue({ id: userId });

      // 2. Pastikan findByPk mengembalikan object yang punya method update
      User.findByPk = jest.fn().mockResolvedValue({
        id: userId,
        update: mockUpdateInstance,
      });

      await userRepository.updateLastLogin(userId, mockOptions);

      // 3. Verifikasi: Apakah findByPk dipanggil dengan benar?
      expect(User.findByPk).toHaveBeenCalledWith(userId, mockOptions);

      // 4. Verifikasi: Apakah instance update dipanggil dengan data yang benar?
      expect(mockUpdateInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          lastLogin: expect.any(Date),
        }),
        mockOptions,
      );
    });
  });
});
