const express = require("express");
const router = express.Router();
const { fetchFarmers } = require("../controllers/farmers");

// Fetch farmers data from the outsource API
router.post("/fetchFarmers", fetchFarmers);

module.exports = router;
