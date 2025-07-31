const express = require("express");
const router = express.Router();
const { fetchCrops, fetchCropHarvests } = require("../controllers/crops.js");

// Fetch crops data from the outsource API
router.post("/fetchCrops", fetchCrops);

router.post("/fetchCropHarvests", fetchCropHarvests);

module.exports = router;
