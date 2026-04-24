const { errorHandler } = require("./error-handler.middleware");
const { validate } = require("./validate.middleware");
const { globalLimiter, loginLimiter } = require("./rate-limiter.middleware");
const { authenticate, validateGoogleToken } = require("./auth.middleware");

module.exports = {
  errorHandler,
  validate,
  globalLimiter,
  loginLimiter,
  authenticate,
  validateGoogleToken,
};
