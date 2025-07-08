const express = require("express");
const router = express.Router();
const {
  fetchCrops,
  fetchCropSummary,
  fetchGapSummary,
} = require("../controllers/crops.js");

// Fetch crops data from the outsource API
router.post("/fetchCrops", fetchCrops);

router.post("/fetchCropSummary", fetchCropSummary);

router.post("/fetchGapSummary", fetchGapSummary);

module.exports = router;
