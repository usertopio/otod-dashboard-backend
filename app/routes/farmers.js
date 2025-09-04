const express = require("express");
const router = express.Router();
const { fetchFarmers } = require("../controllers/farmersCon");

router.post("/fetchFarmers", fetchFarmers);

module.exports = router;
