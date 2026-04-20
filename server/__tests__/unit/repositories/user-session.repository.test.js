const userSessionRepository = require('../../../src/repositories/user-session.repository');
const { UserSession } = require('../../../src/models');

// Mock model Sequelize
jest.mock('../../../src/models', () => ({
  UserSession: {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  }
}));

describe('UserSessionRepository', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create session with correct device name', async () => {
    const mockReq = {
      headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/123.0.0.0' },
      ip: '127.0.0.1'
    };

    await userSessionRepository.createSession({
      userId: 'uuid-123',
      refreshToken: 'token-abc',
      expiresAt: new Date(),
      req: mockReq
    });

    expect(UserSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceName: 'Chrome on MacOS', // Hasil parsing manual helper lu
        userId: 'uuid-123',
        ip: '127.0.0.1'
      }),
      {}
    );
  });

  test('should not find session if it is expired', async () => {
    UserSession.findOne.mockResolvedValue(null);

    const session = await userSessionRepository.findValidSessionByToken('expired-token');
    
    expect(session).toBeNull();
  });
});