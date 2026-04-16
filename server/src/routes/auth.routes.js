const express = require("express");
const router = express.Router();

const { authController } = require("../controllers");
const { loginSchema } = require("../validators");
const { validate } = require("../middleware");

router.post("/login", validate(loginSchema), authController.login);

module.exports = router;
