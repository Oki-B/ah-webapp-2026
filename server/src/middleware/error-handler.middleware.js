const { AppError } = require("../utils");
const { ZodError } = require("zod");

const handleZodError = (err) => {
  const message = "Validasi request gagal";
  const error = new AppError(message, 400);
  error.errorCode = "VALIDATION_ERROR";
  error.details = err.issues.map((e) => ({
    field: e.path.join("."),
    message: e.message,
  }));
  return error;
};

const handleSequelizeError = (err) => {
  let message = err.message;
  let errorCode = "DATABASE_ERROR";

  if (err.name === "SequelizeValidationError") {
    message = `Validasi database gagal: ${err.errors.map((e) => e.message).join(", ")}`;
    errorCode = "DB_VALIDATION_ERROR";
  } else if (err.name === "SequelizeUniqueConstraintError") {
    message = "Data sudah ada (duplikat)";
    errorCode = "DUPLICATE_ENTRY";
  }

  const error = new AppError(message, 400);
  error.errorCode = errorCode; // Titip errorCode
  return error;
};

// Generate handler lain sesuai kebutuhan (JWT, dll)
const errorHandler = (err, req, res, next) => {
  let error = err;

  // 1. Panggil Helper Mapping
  if (err instanceof ZodError) {
    error = handleZodError(err);
  } else if (err.name?.startsWith("Sequelize")) {
    error = handleSequelizeError(err);
  }

  // 2. Tentukan errorCode Final
  // Prioritas: 1. Properti errorCode titipan, 2. Default berdasarkan statusCode
  const errorCode =
    error.errorCode ||
    (error.statusCode === 401
      ? "UNAUTHORIZED"
      : error.statusCode === 403
        ? "FORBIDDEN"
        : error.statusCode === 404
          ? "NOT_FOUND"
          : "INTERNAL_SERVER_ERROR");

  // 3. Susun Response sesuai selera kamu
  const response = {
    status: error.status || "error",
    error_type: errorCode,
    message: error.message,
  };

  if (error.details) {
    response.details = error.details;
  }

  // Cek NODE_ENV buat sembunyiin stack trace
  if (process.env.NODE_ENV?.trim() === "development") {
    response.stack = err.stack;
    console.error("❌ DEBUG LOG:", err);
  }

  res.status(error.statusCode || 500).json(response);
};

module.exports = { errorHandler };
