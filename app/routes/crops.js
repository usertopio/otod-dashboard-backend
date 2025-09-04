const express = require("express");
const router = express.Router();
const { fetchCrops } = require("../controllers/cropsCon.js");

// ✅ Enable crops endpoint
router.post("/fetchCrops", fetchCrops);

module.exports = router;
