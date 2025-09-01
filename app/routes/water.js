const express = require("express");
const router = express.Router();
const { fetchWater } = require("../controllers/waterCon.js");

// Main water endpoints
router.post("/fetchWater", fetchWater);

module.exports = router;
