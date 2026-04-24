const express = require("express");
const router = express.Router();

const { authController } = require("../controllers");
const { authShema } = require("../validators");
const { validate, loginLimiter } = require("../middlewares");
const {
  refreshTokenLimiter,
} = require("../middlewares/rate-limiter.middleware");

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
