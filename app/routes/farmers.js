const express = require("express");
const router = express.Router();
const { fetchFarmers, fetchFarmerSummary } = require("../controllers/farmers");

// Fetch farmers data from the outsource API
router.post("/fetchFarmers", fetchFarmers);

router.get("/fetchFarmerSummary", fetchFarmerSummary);

module.exports = router;
