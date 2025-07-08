const express = require("express");
const router = express.Router();
const {
  fetchCrops,
  fetchCropSummary,
  fetchGapSummary,
  fetchCropStageSummary,
  fetchCropHarvests,
  fetchCropForecastAndYield,
} = require("../controllers/crops.js");

// Fetch crops data from the outsource API
router.post("/fetchCrops", fetchCrops);

router.post("/fetchCropSummary", fetchCropSummary);

router.post("/fetchGapSummary", fetchGapSummary);

router.post("/fetchCropStageSummary", fetchCropStageSummary);

router.post("/fetchCropHarvests", fetchCropHarvests);

router.post("/fetchCropForecastAndYield", fetchCropForecastAndYield);

module.exports = router;
