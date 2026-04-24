const auditService = require("../../../src/services/audit.service");
const { AuditLog } = require("../../../src/models");
const { getSimpleDeviceName } = require("../../../src/utils/");

// 1. MOCKING
jest.mock("../../../src/models", () => ({
  AuditLog: {
    create: jest.fn(),
  },
}));

jest.mock("../../../src/utils/", () => ({
  getSimpleDeviceName: jest.fn(),
}));

describe("AuditService Unit Test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Supaya console.error tidak mengotori terminal saat test catch block
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe("record()", () => {
    const defaultData = {
      action: "LOGIN",
      status: "SUCCESS",
      userId: "user-123",
      email: "test@example.com",
      ip: "192.168.1.1",
      ua: "Mozilla/5.0...",
    };

    it("should call AuditLog.create with correct data", async () => {
      getSimpleDeviceName.mockReturnValue("MacBook Pro");

      await auditService.record(defaultData);

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "LOGIN",
          status: "SUCCESS",
          userId: "user-123",
          ipAddress: "192.168.1.1",
          userAgent: defaultData.ua,
          payload: expect.objectContaining({
            deviceName: "MacBook Pro",
          }),
        }),
        expect.any(Object) // Object options/transaction
      );
    });

    it("should use deviceName from parameters if provided", async () => {
      await auditService.record({
        ...defaultData,
        deviceName: "Custom Phone",
      });

      // Pastikan helper parsing TIDAK dipanggil karena deviceName sudah ada
      expect(getSimpleDeviceName).not.toHaveBeenCalled();
      
      const callArgs = AuditLog.create.mock.calls[0][0];
      expect(callArgs.payload.deviceName).toBe("Custom Phone");
    });

    it("should include metadata in the payload", async () => {
      const metadata = { reason: "Incorrect Password", attempt: 3 };
      
      await auditService.record({
        ...defaultData,
        metadata,
      });

      const callArgs = AuditLog.create.mock.calls[0][0];
      expect(callArgs.reason).toBe("Incorrect Password");
      expect(callArgs.payload).toMatchObject({
        deviceName: expect.any(String),
        attempt: 3,
      });
    });

    it("should default device to 'Unknown Device' if UA is unknown", async () => {
      await auditService.record({
        ...defaultData,
        ua: "unknown",
      });

      const callArgs = AuditLog.create.mock.calls[0][0];
      expect(callArgs.payload.deviceName).toBe("Unknown Device");
    });

    it("should support database transactions", async () => {
      const mockTransaction = { id: "tx-999" };

      await auditService.record({
        ...defaultData,
        transaction: mockTransaction,
      });

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ transaction: mockTransaction })
      );
    });

    it("should gracefully handle errors without throwing", async () => {
      AuditLog.create.mockRejectedValue(new Error("DB Error"));

      // Service ini pake try-catch internal, jadi harusnya tidak throw error ke pemanggil
      await expect(auditService.record(defaultData)).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });
});