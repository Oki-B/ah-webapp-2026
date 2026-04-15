const authService = require('../../../src/services/auth.service');
const { userRepository } = require('../../../src/repositories');
const { comparePassword, generateToken, withTransaction } = require('../../../src/utils');

// 1. Mock semua dependency
jest.mock('../../../src/repositories');
jest.mock('../../../src/utils', () => ({
  ...jest.requireActual('../../../src/utils'), // Ambil fungsi asli lainnya
  comparePassword: jest.fn(),
  generateToken: jest.fn(),
  withTransaction: jest.fn(), // Kita mock helper transaksinya
}));

describe('Auth Service Unit Test', () => {
  const mockUser = {
    id: 'user-123',
    email: 'dev@porto.com',
    password: 'hashedPassword',
    isActive: true,
    isVerified: true,
    role: { name: 'superadmin' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default: withTransaction langsung menjalankan callback-nya
    withTransaction.mockImplementation(async (callback) => await callback('mock-t'));
  });

  describe('Login Functionality', () => {
    
    test('should return token and user data when login successful', async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      generateToken.mockReturnValue('valid-jwt-token');
      userRepository.updateLastLogin.mockResolvedValue(true);

      // Act
      const result = await authService.login('dev@porto.com', 'password123');

      // Assert
      expect(result).toHaveProperty('token', 'valid-jwt-token');
      expect(result.user.role).toBe('superadmin');
      expect(withTransaction).toHaveBeenCalled();
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith(mockUser.id, { transaction: 'mock-t' });
    });

    test('should throw error if email not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login('wrong@email.com', 'password'))
        .rejects.toThrow('Invalid email or password');
    });

    test('should throw error if password mismatch', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(false);

      await expect(authService.login('dev@porto.com', 'wrong-pass'))
        .rejects.toThrow('Invalid email or password');
    });

    test('should throw error if account is not verified', async () => {
      userRepository.findByEmail.mockResolvedValue({ ...mockUser, isVerified: false });
      comparePassword.mockResolvedValue(true);

      await expect(authService.login('dev@porto.com', 'password123'))
        .rejects.toThrow('Account is not verified. Please check your email.');
    });

    test('should throw error if account is inactive', async () => {
      userRepository.findByEmail.mockResolvedValue({ ...mockUser, isActive: false });
      comparePassword.mockResolvedValue(true);

      await expect(authService.login('dev@porto.com', 'password123'))
        .rejects.toThrow('Account is inactive. Please contact support.');
    });
  });
});