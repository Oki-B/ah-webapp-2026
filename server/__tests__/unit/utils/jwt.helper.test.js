const { generateToken, verifyToken } = require('../../../src/utils/jwt.helper');

describe("JWT Helper", () => {
  it("should sign and verify a token", () => {
    const payload = { id: 1, role: 'admin' };
    const token = generateToken(payload);
    expect(token).toBeDefined();

    const decoded = verifyToken(token);
    expect(decoded.id).toBe(1);
  });
});