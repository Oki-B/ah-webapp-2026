const request = require("supertest");
const app = require("../../src/app");

describe("Integration Test: Express App", () => {
  it("must respond with 404 for nonexistent route", async () => {
    const res = await request(app).get("/api/v1/unknown");

    expect(res.statusCode).toBe(404);
    // Sekarang ini pasti lulus karena AppError di app.js sudah mengirim status & error_type
    expect(res.body).toEqual(
      expect.objectContaining({
        status: "fail",
        error_type: "NOT_FOUND",
      }),
    );
  });

  it("must respond with 200 for the root endpoint", async () => {
    const res = await request(app).get("/");

    expect(res.statusCode).toBe(200);
    // Setelah app.js diupdate, ini tidak akan undefined lagi
    expect(res.body.status).toBe("success");
    expect(res.body.message).toBe("Api is running...");
  });

  it("should verify env variables", () => {
    console.log("DB_NAME yang dipake:", process.env.DB_NAME);
  });
});
