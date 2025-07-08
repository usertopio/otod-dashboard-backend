const express = require("express");
const router = express.Router();
const {
  fetchCrops,
  fetchCropSummary,
  fetchGapSummary,
  fetchCropStageSummary,
  fetchCropHarvests,
} = require("../controllers/crops.js");

// Fetch crops data from the outsource API
router.post("/fetchCrops", fetchCrops);

router.post("/fetchCropSummary", fetchCropSummary);

router.post("/fetchGapSummary", fetchGapSummary);

router.post("/fetchCropStageSummary", fetchCropStageSummary);

router.post("/fetchCropHarvests", fetchCropHarvests);

module.exports = router;
