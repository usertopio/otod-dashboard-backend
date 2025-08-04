const express = require("express");
const router = express.Router();
const { fetchSubstance } = require("../controllers/substance.js");

// 🎯 Clean "fetchSubstance" endpoint using GetSubstanceUsageSummaryByMonth
router.post("/fetchSubstance", fetchSubstance);

module.exports = router;
