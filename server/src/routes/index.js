const express = require("express");
const router = express.Router();

// TODO: Import route modules
const authRoutes = require("./auth.routes");

router.use("/auth", authRoutes);

module.exports = router;
