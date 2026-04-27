const express = require("express");
const router = express.Router();

const { authenticate } = require("../middlewares/");

router.use(authenticate); // Pastikan middleware ini benar-benar ada dan berfungsi

router.get("/sessions"); // Dapatkan semua sesi aktif pengguna
router.delete("/sessions/current"); // Hapus sesi saat ini (logout dari perangkat ini saja)
router.delete("/sessions/others"); // Hapus semua sesi kecuali sesi saat ini (logout dari perangkat lain saja)
router.delete("/sessions/:sessionId"); // Hapus sesi tertentu berdasarkan ID (logout dari perangkat tertentu)

module.exports = router;
