const auditService = require("../../../src/services/audit.service");
const { AuditLog } = require("../../../src/models");
const { getSimpleDeviceName } = require("../../../src/utils/");
const geoip = require("geoip-lite"); // Import untuk di-mock

// 1. MOCKING
jest.mock("../../../src/models", () => ({
  AuditLog: {
    create: jest.fn(),
  },
}));

jest.mock("../../../src/utils/", () => ({
  getSimpleDeviceName: jest.fn(),
}));

// Mock geoip-lite
jest.mock("geoip-lite", () => ({
  lookup: jest.fn(),
}));

describe("AuditService Unit Test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe("record()", () => {
    const defaultData = {
      action: "LOGIN",
      status: "SUCCESS",
      userId: "user-123",
      email: "test@example.com",
      ip: "8.8.8.8",
      ua: "Mozilla/5.0...",
    };

    it("should call AuditLog.create with device and geolocation data", async () => {
      // Setup Mock returns
      getSimpleDeviceName.mockReturnValue("MacBook Pro");
      geoip.lookup.mockReturnValue({
        city: "Mountain View",
        country: "US",
        region: "CA",
        ll: [37.4223, -122.0841],
      });

      await auditService.record(defaultData);

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: "8.8.8.8",
          payload: expect.objectContaining({
            deviceName: "MacBook Pro",
            location: "Mountain View, US",
            geo: expect.objectContaining({
              city: "Mountain View",
              ll: [37.4223, -122.0841]
            })
          }),
        }),
        expect.any(Object)
      );
    });

    it("should handle unknown location if geoip returns null", async () => {
      geoip.lookup.mockReturnValue(null); // Simulasi IP lokal atau tidak terdeteksi

      await auditService.record(defaultData);

      const callArgs = AuditLog.create.mock.calls[0][0];
      expect(callArgs.payload.location).toBe("Unknown Location");
      expect(callArgs.payload.geo).toBeNull();
    });

    it("should merge metadata with device and geo information", async () => {
      const metadata = { reason: "Security Check" };
      geoip.lookup.mockReturnValue({ city: "Jakarta", country: "ID" });

      await auditService.record({
        ...defaultData,
        metadata
      });

      const callArgs = AuditLog.create.mock.calls[0][0];
      expect(callArgs.reason).toBe("Security Check");
      expect(callArgs.payload).toMatchObject({
        deviceName: expect.any(String),
        location: "Jakarta, ID"
      });
    });

    // Test case sisanya (transaction & error handling) tetap sama
    it("should support database transactions", async () => {
      const mockTransaction = { id: "tx-999" };
      await auditService.record({ ...defaultData, transaction: mockTransaction });

      expect(AuditLog.create).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ transaction: mockTransaction })
      );
    });

    it("should gracefully handle errors without throwing", async () => {
      AuditLog.create.mockRejectedValue(new Error("DB Error"));
      await expect(auditService.record(defaultData)).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });
});