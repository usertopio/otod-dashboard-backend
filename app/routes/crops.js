const express = require("express");
const router = express.Router();
const { fetchCropsUntilTarget } = require("../controllers/crops.js");

// ✅ Enable crops endpoint
router.post("/fetchCropsUntilTarget", fetchCropsUntilTarget);

module.exports = router;
