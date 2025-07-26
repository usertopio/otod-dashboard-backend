const express = require("express");
const router = express.Router();
const {
  fetchWaterUsageSummaryByCrop,
  fetchWaterUsageSummaryByMonth,
} = require("../controllers/water.js");

// Fetch Lands data from the outsource API
router.post("/fetchWaterUsageSummaryByCrop", fetchWaterUsageSummaryByCrop);

// Fetch Land Summary data from the outsource API
router.post("/fetchWaterUsageSummaryByMonth", fetchWaterUsageSummaryByMonth);

module.exports = router;
