const express = require("express");
const router = express.Router();

const { authController } = require("../controllers");
const { authShema } = require("../validators");
const { validate, loginLimiter } = require("../middleware");
const {
  refreshTokenLimiter,
} = require("../middleware/rate-limiter.middleware");

router.post(
  "/login",
  loginLimiter,
  validate(authShema.login),
  authController.login,
);

router.post(
  "/refresh-token",
  refreshTokenLimiter,
  validate(authShema.refresh),
  authController.refresh,
);

module.exports = router;
