const { errorHandler } = require("../../../src/middlewares/error-handler.middleware");
const { AppError } = require("../../../src/utils");
const { ZodError } = require("zod");

describe("Error Handler Middleware Unit Test", () => {
  let req, res, next;

  beforeEach(() => {
    req = { path: "/api/test" };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    // Mock console.error biar terminal gak berisik
    jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.NODE_ENV = "production";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // 1. TEST: ZodError (Pake ZodError asli biar lolos 'instanceof')
  it("should handle ZodError correctly", () => {
    const zodErr = new ZodError([
      { path: ["email"], message: "Invalid email", code: "invalid_string", validation: "email" }
    ]);

    errorHandler(zodErr, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error_type: "VALIDATION_ERROR",
        details: [{ field: "email", message: "Invalid email" }]
      })
    );
  });

  // 2. TEST: Sequelize Unique Constraint
  it("should handle SequelizeUniqueConstraintError", () => {
    const seqErr = {
      name: "SequelizeUniqueConstraintError",
      message: "Validation error",
      errors: [{ path: "email", message: "email must be unique" }]
    };

    errorHandler(seqErr, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error_type: "DUPLICATE_ENTRY",
        message: "Data sudah ada (duplikat)",
        details: [{ field: "email", message: "email must be unique" }]
      })
    );
  });

  // 3. TEST: JWT Expired
  it("should handle TokenExpiredError", () => {
    const jwtErr = { name: "TokenExpiredError", message: "jwt expired" };

    errorHandler(jwtErr, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error_type: "TOKEN_EXPIRED",
        message: "Sesi Anda telah berakhir, silakan login ulang"
      })
    );
  });

  // 4. TEST: Direct AppError (UNAUTHORIZED case)
  it("should handle direct AppError 401 and map to UNAUTHORIZED", () => {
    const appErr = new AppError("Invalid credentials", 401);

    errorHandler(appErr, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error_type: "UNAUTHORIZED",
        message: "Invalid credentials"
      })
    );
  });

  // 5. TEST: Development Mode (Stack Trace)
  it("should include stack trace in development mode", () => {
    process.env.NODE_ENV = "development";
    const genericErr = new Error("Something broke");

    errorHandler(genericErr, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        stack: expect.any(String)
      })
    );
  });
});