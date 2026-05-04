const request = require("supertest");
const app = require("../../../src/app"); // Path ke express app lu
const { authService, sessionService } = require("../../../src/services");

// 1. MOCK SERVICES
jest.mock("../../../src/services/auth.service");
jest.mock("../../../src/services/session.service");

describe("AuthController Integration Test", () => {
  const mockUser = { id: "user-123", email: "test@example.com", role: "user" };
  const mockDeviceInfo = { ip: "127.0.0.1", ua: "Jest-Test-Agent" };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/login", () => {
    it("should return 200 and set refresh_token cookie on successful login", async () => {
      // Mock service response
      authService.login.mockResolvedValue({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        user: mockUser,
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "password123" })
        .set("User-Agent", mockDeviceInfo.ua);

      // Assertions
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.accessToken).toBe("mock-access-token");
      expect(res.body.data.user).toEqual(mockUser);

      // Verifikasi Cookie: jsonwebtoken biasanya dikirim via header set-cookie
      const cookies = res.headers["set-cookie"];
      expect(
        cookies.some((c) => c.includes("refresh_token=mock-refresh-token")),
      ).toBe(true);
      expect(cookies.some((c) => c.includes("HttpOnly"))).toBe(true);
    });

    it("should return error status when authService throws an error", async () => {
      authService.login.mockRejectedValue({
        statusCode: 401,
        message: "Invalid email or password",
      });

      const res = await request(app)
        .post("/api/auth/login")
        // Pastikan email & password sesuai format Zod lu (misal: min 6 karakter)
        .send({
          email: "valid-format@test.com",
          password: "password-valid-length",
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /api/auth/refresh-token", () => {
    it("should rotate tokens successfully using cookie", async () => {
      sessionService.refreshSession.mockResolvedValue({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });

      const res = await request(app)
        .post("/api/auth/refresh-token")
        .set("Cookie", ["refreshToken=old-token"]) // Simulasi browser kirim cookie
        .send();

      expect(res.statusCode).toBe(200);
      expect(res.body.data.accessToken).toBe("new-access-token");

      // Pastikan cookie baru juga diset
      const cookies = res.headers["set-cookie"];
      expect(
        cookies.some((c) => c.includes("refresh_token=new-refresh-token")),
      ).toBe(true);
    });
  });

  //   describe("POST /api/auth/google", () => {
  //     it("should handle google login successfully", async () => {
  //       // Karena googleLogin pake req.user (biasanya dari middleware passport/verify),
  //       // kita asumsi middleware itu sudah di-mock atau kita kirim data yang sesuai.
  //       authService.loginGoogle.mockResolvedValue({
  //         accessToken: "google-at",
  //         refreshToken: "google-rt",
  //         user: mockUser,
  //       });

  //       // Catatan: Jika lu pake passport-google, lu mungkin perlu mock middleware-nya
  //       // agar mengisi req.user sebelum sampai ke controller.
  //       const res = await request(app).post("/api/auth/google").send(); // Payload biasanya sudah ada di req.user dari middleware sebelumnya

  //       expect(res.statusCode).toBe(200);
  //       expect(res.body.data.accessToken).toBe("google-at");
  //     });
  //   });
});
