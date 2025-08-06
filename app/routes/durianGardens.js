const express = require("express");
const router = express.Router();
const {
  fetchDurianGardensUntilTarget,
} = require("../controllers/durianGardens.js");

// 🌿 Modern endpoint following farmers template
router.post("/fetchDurianGardensUntilTarget", fetchDurianGardensUntilTarget);

module.exports = router;
