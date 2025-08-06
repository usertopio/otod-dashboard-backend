const express = require("express");
const router = express.Router();
const { fetchCropsUntilTarget } = require("../controllers/crops.js");

// 🔧 Modern endpoint following farmers template
router.post("/fetchCropsUntilTarget", fetchCropsUntilTarget);

module.exports = router;
