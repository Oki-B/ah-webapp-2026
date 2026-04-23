const { AppError } = require("../utils");
const { ZodError } = require("zod");

// 1. Helper: Mapping Zod (Request Validation)
const handleZodError = (err) => {
  const error = new AppError("Validasi request gagal", 400);
  error.errorCode = "VALIDATION_ERROR";
  error.details = err.issues.map((e) => ({
    field: e.path.join("."),
    message: e.message,
  }));
  return error;
};

// 2. Helper: Mapping Sequelize (Database Validation)
const handleSequelizeError = (err) => {
  let message = err.message;
  let errorCode = "DATABASE_ERROR";
  let details = null;

  if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
    message = err.name === "SequelizeUniqueConstraintError" 
      ? "Data sudah ada (duplikat)" 
      : "Validasi database gagal";
    errorCode = err.name === "SequelizeUniqueConstraintError" ? "DUPLICATE_ENTRY" : "DB_VALIDATION_ERROR";
    
    // Ambil detail field yang bermasalah dari Sequelize biar konsisten sama Zod
    details = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  const error = new AppError(message, 400);
  error.errorCode = errorCode;
  error.details = details;
  return error;
};

// 3. MAIN MIDDLEWARE
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // A. Identifikasi Jenis Error
  if (err instanceof ZodError) {
    error = handleZodError(err);
  } else if (err.name?.startsWith("Sequelize")) {
    error = handleSequelizeError(err);
  }

  // B. Tentukan errorCode (Prioritas titipan -> Default status)
  const errorCode =
    error.errorCode ||
    (error.statusCode === 401 ? "UNAUTHORIZED" : 
     error.statusCode === 403 ? "FORBIDDEN" : 
     error.statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR");

  // C. Susun Final Response
  const response = {
    status: error.statusCode >= 500 ? "error" : "fail",
    error_type: errorCode,
    message: error.message,
    ...(error.details && { details: error.details }), // Hanya muncul jika ada details
  };

  // D. Development Logging & Stack Trace
  if (process.env.NODE_ENV?.trim() === "development") {
    response.stack = err.stack;
    console.error("❌ [ERROR]:", {
      type: err.name,
      message: err.message,
      path: req.path,
      ...(error.details && { details: error.details })
    });
  }

  res.status(error.statusCode).json(response);
};

module.exports = { errorHandler };