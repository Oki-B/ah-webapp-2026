const { getSimpleDeviceName, extractClientInfo } = require("../../../src/utils/device.helper");

describe("DeviceHelper Unit Test", () => {
  
  describe("getSimpleDeviceName()", () => {
    it("should return 'Unknown Device' if user-agent is missing", () => {
      expect(getSimpleDeviceName(null)).toBe("Unknown Device");
      expect(getSimpleDeviceName("")).toBe("Unknown Device");
    });

    it("should parse Chrome on MacOS correctly", () => {
      const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      const result = getSimpleDeviceName(ua);
      
      expect(result).toBe("Chrome on macOS");
    });

    it("should parse Firefox on Windows correctly", () => {
      const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0";
      const result = getSimpleDeviceName(ua);
      
      expect(result).toBe("Firefox on Windows");
    });

    it("should parse Safari on iOS (iPhone) correctly", () => {
      const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1";
      const result = getSimpleDeviceName(ua);
      
      expect(result).toBe("Mobile Safari on iOS");
    });

    it("should handle weird or unknown user-agents gracefully", () => {
      const ua = "Some-Random-Bot-1.0";
      const result = getSimpleDeviceName(ua);
      
      // UA Parser biasanya tetap berusaha cari OS/Browser, tapi minimal tidak crash
      expect(typeof result).toBe("string");
      expect(result).toContain("on"); 
    });
  });

  describe("extractClientInfo()", () => {
    it("should extract IP from x-forwarded-for (Proxy/Load Balancer)", () => {
      const mockReq = {
        headers: {
          "user-agent": "Test-UA",
          "x-forwarded-for": "203.0.113.1, 192.168.1.1" // Multiple IPs
        },
        socket: { remoteAddress: "127.0.0.1" }
      };

      const info = extractClientInfo(mockReq);

      expect(info.ua).toBe("Test-UA");
      expect(info.ip).toBe("203.0.113.1"); // Harus ambil yang pertama
    });

    it("should fallback to remoteAddress if x-forwarded-for is missing", () => {
      const mockReq = {
        headers: {
          "user-agent": "Test-UA"
        },
        socket: { remoteAddress: "192.168.1.50" }
      };

      const info = extractClientInfo(mockReq);

      expect(info.ip).toBe("192.168.1.50");
    });

    it("should return '0.0.0.0' if no IP source is available", () => {
      const mockReq = {
        headers: {},
        socket: {}
      };

      const info = extractClientInfo(mockReq);

      expect(info.ip).toBe("0.0.0.0");
    });
  });
});