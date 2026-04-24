const { onServerError } = require("../../../src/utils/"); // Sesuaikan path-nya

describe("onServerError Unit Test", () => {
  let mockExit;
  let mockConsoleError;

  beforeEach(() => {
    // Mock process.exit agar tidak benar-benar mematikan test runner
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    // Mock console.error agar terminal tetap bersih
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should throw error if syscall is not 'listen'", () => {
    const error = new Error("Generic Error");
    error.syscall = "read";

    expect(() => onServerError(error, 3000)).toThrow("Generic Error");
    expect(mockExit).not.toHaveBeenCalled();
  });

  it("should handle EACCES error (Privileges)", () => {
    const error = new Error();
    error.syscall = "listen";
    error.code = "EACCES";

    onServerError(error, 3000);

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining("Port 3000 requires elevated privileges"));
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("should handle EADDRINUSE error (Port taken)", () => {
    const error = new Error();
    error.syscall = "listen";
    error.code = "EADDRINUSE";

    onServerError(error, "3000"); // Tes versi string/pipe

    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining("Pipe 3000 is already in use"));
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("should throw error for unknown error codes even if syscall is 'listen'", () => {
    const error = new Error("Unknown Code");
    error.syscall = "listen";
    error.code = "ETIMEDOUT";

    expect(() => onServerError(error, 3000)).toThrow(error);
    expect(mockExit).not.toHaveBeenCalled();
  });
});