const express = require("express");
const router = express.Router();
const { fetchWaterUntilTarget } = require("../controllers/water");

// Main water endpoints
router.post("/fetchWaterUntilTarget", fetchWaterUntilTarget);

module.exports = router;
