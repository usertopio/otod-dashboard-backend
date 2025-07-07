const express = require("express");
const router = express.Router();
const { fetchCrops, fetchCropSummary } = require("../controllers/crops.js");

// Fetch crops data from the outsource API
router.post("/fetchCrops", fetchCrops);

module.exports = router;
