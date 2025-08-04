const express = require("express");
const router = express.Router();
const { fetchGapUntilTarget } = require("../controllers/gap.js");

// 🎯 Only advanced "UntilTarget" endpoint
router.post("/fetchGapUntilTarget", fetchGapUntilTarget);

module.exports = router;
