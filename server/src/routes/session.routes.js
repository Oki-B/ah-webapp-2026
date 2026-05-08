const express = require("express");
const router = express.Router();

const { authenticate, validate } = require("../middlewares/");
const { sessionController } = require("../controllers/");
const { sessionSchema } = require("../validators/");

router.use(authenticate); // Pastikan middleware ini benar-benar ada dan berfungsi

router.get("/", sessionController.getSessions);
router.delete("/current", sessionController.logout);
router.delete("/others", sessionController.logoutOtherDevices);
router.delete(
  "/:sessionId",
  validate(sessionSchema.revokeDevice),
  sessionController.logoutFromDevice,
);

module.exports = router;
