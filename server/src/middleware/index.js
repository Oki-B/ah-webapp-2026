const { errorHandler } = require("./error-handler.middleware");
const { validate } = require("./validate.middleware");
const { globalLimiter, loginLimiter } = require("./rate-limiter.middleware");

module.exports = {
  errorHandler,
  validate,
  globalLimiter,
  loginLimiter,
};
