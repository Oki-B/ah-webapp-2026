const authService = require('../../../src/services/auth.service'); 
const { userRepository } = require('../../../src/repositories');
const { AppError } = require('../../../src/utils'); 
const utils = require('../../../src/utils'); 

// Mocking 
jest.mock('../../../src/repositories');
jest.mock('../../../src/utils', () => {
  const actualUtils = jest.requireActual('../../../src/utils');
  return {
    ...actualUtils, // use APPError
    comparePassword: jest.fn(),
    generateToken: jest.fn(),
    withTransaction: jest.fn((cb) => cb('mock-transaction')),
  };
});

describe('AuthService - Login', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw AppError 401 when user is not found', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    try {
      await authService.login('wrong@mail.com', 'password123');
      throw new Error('Test should have thrown AppError');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Invalid email or password");
    }
  });

  it('should return token and user data on successful login', async () => {
    const mockUser = {
      id: 1,
      email: 'test@mail.com',
      password: 'hashedpassword',
      isActive: true,
      isVerified: true,
      role: { name: 'admin' }
    };

    userRepository.findByEmail.mockResolvedValue(mockUser);
    utils.comparePassword.mockResolvedValue(true);
    utils.generateToken.mockReturnValue('mock-token');

    const result = await authService.login('test@mail.com', 'password123');

    expect(result).toHaveProperty('token');
    expect(result.user.email).toBe('test@mail.com');
  });
});