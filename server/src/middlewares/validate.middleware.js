const { ZodError } = require("zod");

const validate = (schema) => (req, res, next) => {
  try {
    const parsedData = schema.parse({
      body: req.body || {},
      query: req.query || {},
      params: req.params || {},
      cookies: req.cookies || {},
      user: req.user || {},
    });

    // overwrite biar udah clean & typed
    req.body = parsedData.body;
    req.query = parsedData.query;
    req.params = parsedData.params;
    req.cookies = parsedData.cookies;
    req.user = parsedData.user;

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(error); // Biarkan error ini ditangani oleh errorHandler middleware
    }
    next(error);
  }
};

module.exports = { validate };
