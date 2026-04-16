require("dotenv").config({
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
  override: true,
});
const express = require("express");
const cors = require("cors");
const { errorHandler } = require("./middleware/"); // Pastikan export-nya benar
const AppError = require("./utils/app-error.helper"); // Import class error kamu

const app = express();
const router = require("./routes/");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Root Route
app.get("/", (req, res) =>
  res.status(200).json({ status: "success", message: "Api is running..." }),
);

// 2. Pasang Router utama kamu di sini
app.use("/api", router);

// 3. HANDLER 404 (Taruh di bawah semua route, tapi di atas errorHandler)
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4. ERROR HANDLER (Wajib paling terakhir)
app.use(errorHandler);

module.exports = app;
