const request = require("supertest");
const app = require("../../src/app");

describe("Integration Test: Express App", () => {
  it("must respond with 404 if route is not found (Handle 404)", async () => {
    const res = await request(app).get("/nonexistent-route");

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe("fail");
    expect(res.body.message).toMatch(/Can't find/);
  });

  // Jika kamu punya route GET / di app.js, tambahkan test ini:

  it("must respond with 200 for the main endpoint", async () => {
    const res = await request(app).get("/");

    console.log(res.body); // Debug response body
    expect(res.statusCode).toBe(200);
  });
});
