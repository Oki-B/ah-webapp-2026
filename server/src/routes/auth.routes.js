const express = require("express");
const router = express.Router();

const { authController } = require("../controllers");
const { loginSchema } = require("../validators");
const { validate, loginLimiter } = require("../middleware");

router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  authController.login,
);

module.exports = router;
