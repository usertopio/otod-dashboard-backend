const express = require("express");
const router = express.Router();
const { fetchWater } = require("../controllers/water.js");

// 🎯 Clean "fetchWater" endpoint using GetWaterUsageSummaryByMonth
router.post("/fetchWater", fetchWater);

module.exports = router;
