const { AppError } = require("../../src/utils/");

describe("Unit Test: AppError", () => {
  it("must create an error object with the correct statusCode and status", () => {
    const err = new AppError("An error occurred", 404);

    expect(err.statusCode).toBe(404);
    expect(err.status).toBe("fail"); // Because 4xx is a 'fail' status
    expect(err.isOperational).toBe(true);
    expect(err.message).toBe("An error occurred");
  });

  it('must set status "error" for statusCode 500', () => {
    const err = new AppError("Server Error", 500);
    expect(err.status).toBe("error");
  });
});
