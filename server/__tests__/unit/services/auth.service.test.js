const authService = require("../../../src/services/auth.service");
const { userRepository } = require("../../../src/repositories");
const { AppError } = require("../../../src/utils");
const utils = require("../../../src/utils");
const { sequelize } = require("../../../src/models");

// Mocking
jest.mock("../../../src/repositories");
jest.mock("../../../src/utils", () => {
  const actualUtils = jest.requireActual("../../../src/utils");
  return {
    ...actualUtils, // use APPError
    comparePassword: jest.fn(),
    generateToken: jest.fn(),
    withTransaction: jest.fn((cb) => cb("mock-transaction")),
  };
});

describe("AuthService - Login", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("should throw AppError 401 when user is not found (Cleaner Version)", async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login("wrong@mail.com", "password123"),
    ).rejects.toThrow(AppError);

    // Kalau mau cek status code secara spesifik:
    try {
      await authService.login("wrong@mail.com", "password123");
    } catch (error) {
      expect(error.statusCode).toBe(401);
    }
  });

  it("should return token and user data on successful login", async () => {
    const mockUser = {
      id: 1,
      email: "test@mail.com",
      password: "hashedpassword",
      isActive: true,
      isVerified: true,
      role: { name: "admin" },
    };

    userRepository.findByEmail.mockResolvedValue(mockUser);
    utils.comparePassword.mockResolvedValue(true);
    utils.generateToken.mockReturnValue("mock-token");

    const result = await authService.login("test@mail.com", "password123");

    expect(result).toHaveProperty("token");
    expect(result.user.email).toBe("test@mail.com");
  });

  it("should throw AppError 401 when password does not match", async () => {
    const mockUser = {
      id: 1,
      email: "test@mail.com",
      password: "hashedpassword",
    };

    userRepository.findByEmail.mockResolvedValue(mockUser);
    // Kita paksa comparePassword return false
    utils.comparePassword.mockResolvedValue(false);

    try {
      await authService.login("test@mail.com", "wrongpassword");
      throw new Error("Test should have thrown AppError");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Invalid email or password");
    }
  });

  it("should throw AppError 403 when user is not active", async () => {
    const mockUser = { id: 1, email: "inactive@mail.com", isActive: false };

    userRepository.findByEmail.mockResolvedValue(mockUser);
    utils.comparePassword.mockResolvedValue(true);

    await expect(
      authService.login("inactive@mail.com", "password123"),
    ).rejects.toThrow(AppError);
    // Sesuaikan status code dan pesannya dengan logic kamu (biasanya 403)
  });
});
