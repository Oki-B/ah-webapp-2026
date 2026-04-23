const { withTransaction } = require('../../../src/utils/transaction.helper');
const db = require('../../../src/models');
const AppError = require('../../../src/utils/app-error.helper');

// Mock models/index.js
jest.mock('../../../src/models', () => ({
  sequelize: {
    transaction: jest.fn()
  }
}));

describe('Transaction Helper (withTransaction)', () => {
  let mockT;

  beforeEach(() => {
    mockT = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };
    db.sequelize.transaction.mockResolvedValue(mockT);
    jest.clearAllMocks();
  });

  // 1. Test jalur sukses (Buat transaksi baru)
  test('should create new transaction and commit if callback succeeds', async () => {
    const mockData = { success: true };
    const callback = jest.fn().mockResolvedValue(mockData);

    const result = await withTransaction(callback);

    expect(db.sequelize.transaction).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(mockT);
    expect(mockT.commit).toHaveBeenCalled();
    expect(result).toEqual(mockData);
  });

  // 2. Test jalur nested (Pakai transaksi yang sudah ada)
  test('should use existing transaction if provided', async () => {
    const existingT = { id: 'existing-t' };
    const callback = jest.fn().mockResolvedValue('nested-success');

    const result = await withTransaction(callback, existingT);

    expect(db.sequelize.transaction).not.toHaveBeenCalled(); // Tidak buat baru
    expect(callback).toHaveBeenCalledWith(existingT);
    expect(result).toBe('nested-success');
  });

  // 3. Test jalur gagal (Rollback)
  test('should rollback and throw AppError if callback fails', async () => {
    const callback = jest.fn().mockRejectedValue(new Error('DB Error'));

    await expect(withTransaction(callback)).rejects.toThrow(AppError);
    
    expect(mockT.rollback).toHaveBeenCalled();
    expect(mockT.commit).not.toHaveBeenCalled();
  });

  // 4. Test jika Sequelize Instance tidak ditemukan (Branch coverage)
  test('should throw AppError if sequelize instance is missing', async () => {
    // Simulasikan sequelize undefined
    const originalDb = require('../../../src/models');
    const backupSequelize = originalDb.sequelize;
    originalDb.sequelize = undefined;

    await expect(withTransaction(jest.fn())).rejects.toThrow(/Sequelize instance not found/);

    // Kembalikan ke asal
    originalDb.sequelize = backupSequelize;
  });
});