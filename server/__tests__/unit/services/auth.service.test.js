const authService = require("../../../src/services/auth.service");
const { userRepository } = require("../../../src/repositories");
const AuditService = require("../../../src/services/audit.service"); // Import AuditService
const { AppError } = require("../../../src/utils");
const utils = require("../../../src/utils");
const { sequelize } = require("../../../src/models");

// Mocking
jest.mock("../../../src/repositories");
jest.mock("../../../src/services/audit.service"); // Mock AuditService
jest.mock("../../../src/utils", () => {
  const actualUtils = jest.requireActual("../../../src/utils");
  return {
    ...actualUtils,
    comparePassword: jest.fn(),
    generateToken: jest.fn(),
    withTransaction: jest.fn((cb) => cb("mock-transaction")),
    delay: jest.fn(() => Promise.resolve()), // Mock delay biar test lu kenceng gak nunggu 1.5 detik
  };
});

describe("AuthService - Login", () => {
  // Mock request object (req) yang dibutuhin AuditService
  const mockReq = {
    ip: "127.0.0.1",
    headers: { "user-agent": "jest-test" },
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("should throw AppError 401 when user is not found and record failure", async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login("wrong@mail.com", "password123", mockReq),
    ).rejects.toThrow(AppError);

    // Pastikan AuditService mencatat kegagalan
    expect(AuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "LOGIN_LOCAL",
        status: "FAILED",
        email: "wrong@mail.com",
      }),
    );
  });

  it("should return token and user data on successful login", async () => {
    const mockUser = {
      id: "uuid-123",
      email: "test@mail.com",
      password: "hashedpassword",
      isActive: true,
      isVerified: true,
      role: { name: "admin" },
    };

    userRepository.findByEmail.mockResolvedValue(mockUser);
    utils.comparePassword.mockResolvedValue(true);
    utils.generateToken.mockReturnValue("mock-token");

    const result = await authService.login(
      "test@mail.com",
      "password123",
      mockReq,
    );

    expect(result).toHaveProperty("token");
    expect(result.user.email).toBe("test@mail.com");

    // Pastikan AuditService mencatat sukses
    expect(AuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "LOGIN_LOCAL",
        status: "SUCCESS",
        userId: "uuid-123",
      }),
    );
  });

  it("should throw AppError 401 when password does not match", async () => {
    const mockUser = {
      id: "uuid-123",
      email: "test@mail.com",
      password: "hashedpassword",
    };

    userRepository.findByEmail.mockResolvedValue(mockUser);
    utils.comparePassword.mockResolvedValue(false);

    try {
      await authService.login("test@mail.com", "wrongpassword", mockReq);
    } catch (error) {
      expect(error.statusCode).toBe(401);
      expect(AuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "FAILED",
          metadata: expect.objectContaining({ reason: "Invalid password" }), // Tambahin bungkus metadata
        }),
      );
    }
  });

  it("should throw AppError 403 when user is not active", async () => {
    const mockUser = {
      id: "uuid-123",
      email: "inactive@mail.com",
      password: "hashedpassword",
      isActive: false,
    };

    userRepository.findByEmail.mockResolvedValue(mockUser);
    utils.comparePassword.mockResolvedValue(true);

    await expect(
      authService.login("inactive@mail.com", "password123", mockReq),
    ).rejects.toThrow(AppError);
  });
});

describe("AuthService - Google Login", () => {
  const mockReq = { ip: "127.0.0.1", headers: { "user-agent": "jest-test" } };
  const googlePayload = { sub: "google-id-123", email: "google@mail.com" };

  it("should link account and return token if user exists without googleId", async () => {
    const mockUser = {
      id: "uuid-123",
      email: "google@mail.com",
      googleId: null,
      role: { name: "guest" },
    };

    userRepository.findByEmail.mockResolvedValue(mockUser);

    const result = await authService.loginGoogle(googlePayload, mockReq);

    // __tests__/unit/services/auth.service.test.js

    expect(userRepository.update).toHaveBeenCalledWith(
      // Argumen 1: Data yang diupdate
      { googleId: "google-id-123" },

      // Argumen 2: Options (where dan transaction)
      expect.objectContaining({
        where: { id: mockUser.id },
        transaction: expect.anything(), // atau "mock-transaction" sesuai mock lu
      }),
    );
    expect(result.token).toBeDefined();
  });

  it("should throw AppError 401 if user tries to login via Google but not found in DB", async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      authService.loginGoogle(
        { sub: "123", email: "stranger@mail.com" },
        mockReq,
      ),
    ).rejects.toThrow(AppError);

    expect(AuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "FAILED",
        metadata: expect.objectContaining({
          reason: "User not invited or not registered",
        }),
      }),
    );
  });
});
