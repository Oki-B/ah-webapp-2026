const express = require("express");
const router = express.Router();

const { authenticate, validate } = require("../middlewares/");
const { sessionController } = require("../controllers/");
const { sessionSchema } = require("../validators/");

router.use(authenticate); // Pastikan middleware ini benar-benar ada dan berfungsi

router.get("/sessions", sessionController.getSessions);
router.delete("/sessions/current", sessionController.logout);
router.delete("/sessions/others", sessionController.logoutOtherDevices);
router.delete(
  "/sessions/:sessionId",
  validate(sessionSchema),
  sessionController.logoutFromDevice,
);

module.exports = router;
