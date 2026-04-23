const { hashPassword, comparePassword } = require("../../../src/utils");

describe("Bcrypt Utility", () => {
  const plainPassword = "mySecretPassword123";

  test("should return a hashed string different from plain text", async () => {
    const hash = await hashPassword(plainPassword);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(plainPassword);
    // Bcrypt hash biasanya diawali dengan $2a$ atau $2b$
    expect(hash).toMatch(/^\$2[ayb]\$.+/);
  });

  test("should return true for matching password and hash", async () => {
    const hash = await hashPassword(plainPassword);
    const result = await comparePassword(plainPassword, hash);

    expect(result).toBe(true);
  });

  test("should return false for incorrect password", async () => {
    const hash = await hashPassword(plainPassword);
    const result = await comparePassword("wrongPassword", hash);

    expect(result).toBe(false);
  });
});
