const express = require("express");
const router = express.Router();
const { fetchWaterUsageSummaryByMonth } = require("../controllers/water.js");

// Fetch Land Summary data from the outsource API
router.post("/fetchWaterUsageSummaryByMonth", fetchWaterUsageSummaryByMonth);

module.exports = router;
