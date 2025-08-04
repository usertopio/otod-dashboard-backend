const express = require("express");
const router = express.Router();
const { fetchMerchantsUntilTarget } = require("../controllers/merchants.js");

// 🎯 Only advanced "UntilTarget" endpoint
router.post("/fetchMerchantsUntilTarget", fetchMerchantsUntilTarget);

module.exports = router;
