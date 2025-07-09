const express = require("express");
const router = express.Router();
const {
  fetchSubstanceUsageSummaryByCrop,
  fetchSubstanceUsageSummaryByMonth,
} = require("../controllers/substance.js");

// Fetch Lands data from the outsource API
router.post(
  "/fetchSubstanceUsageSummaryByCrop",
  fetchSubstanceUsageSummaryByCrop
);

// Fetch Land Summary data from the outsource API
router.post(
  "/fetchSubstanceUsageSummaryByMonth",
  fetchSubstanceUsageSummaryByMonth
);

module.exports = router;
