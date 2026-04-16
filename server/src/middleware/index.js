const { errorHandler } = require("./error-handler.middleware");
const { validate } = require("./validate.middleware");

module.exports = {
  errorHandler,
  validate,
};
