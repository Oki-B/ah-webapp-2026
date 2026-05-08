const { ZodError } = require("zod");

const validate = (schema) => (req, res, next) => {
  try {
    const parsedData = schema.parse({
      body: req.body || {},
      query: req.query || {},
      params: req.params || {},
      cookies: req.cookies || {},
      // user: req.user || {}, // Tidak perlu memparse user di sini
    });

    // Overwrite data input agar bersih (hanya yang ada di schema yang masuk)
    if (parsedData.body) req.body = parsedData.body;
    if (parsedData.query) req.query = parsedData.query;
    if (parsedData.params) req.params = parsedData.params;
    if (parsedData.cookies) req.cookies = parsedData.cookies;
    
    // JANGAN TIMPA req.user DI SINI
    // Biarkan data dari middleware authenticate tetap utuh

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(error); 
    }
    next(error);
  }
};

module.exports = { validate };