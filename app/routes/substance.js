const express = require("express");
const router = express.Router();
const {
  fetchSubstanceUsageSummaryByMonth,
} = require("../controllers/substance.js");

// Fetch Land Summary data from the outsource API
router.post(
  "/fetchSubstanceUsageSummaryByMonth",
  fetchSubstanceUsageSummaryByMonth
);

module.exports = router;
