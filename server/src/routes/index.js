const express = require("express");
const router = express.Router();

// TODO: Import route modules
const authRoutes = require("./auth.routes");
const sessionsRoutes = require("./session.routes");

router.use("/auth", authRoutes);
router.use("/sessions", sessionsRoutes);

module.exports = router;
