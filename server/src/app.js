require("dotenv").config({
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
  override: true,
});

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { errorHandler, globalLimiter } = require("./middlewares"); // Pastikan export-nya benar
const AppError = require("./utils/app-error.helper"); // Import class error kamu

const app = express();
const router = require("./routes/");

// app.set("trust proxy", true); // Penting untuk rate limiter yang berada di belakang proxy (misal: Nginx, Heroku, dll)
if (process.env.NODE_ENV === "test") {
  app.set("trust proxy", false);
} else {
  app.set("trust proxy", false);
}
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 1. Root Route
app.get("/", (req, res) =>
  res.status(200).json({ status: "success", message: "Api is running..." }),
);

// 2. Pasang Router utama kamu di sini
app.use("/api", globalLimiter, router);

// 3. HANDLER 404 (Taruh di bawah semua route, tapi di atas errorHandler)
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4. ERROR HANDLER (Wajib paling terakhir)
app.use(errorHandler);

module.exports = app;
