const { normalizePort } = require("../../../src/utils");

describe("Unit Test: normalizePort", () => {
  it("must return a number if the input is a string number", () => {
    expect(normalizePort("3000")).toBe(3000);
  });

  it("must return a string if the input is a named pipe (non-numeric string)", () => {
    expect(normalizePort("pipe_test")).toBe("pipe_test");
  });

  it("must return false if the input is a negative number", () => {
    expect(normalizePort("-1")).toBe(false);
  });
});
