const express = require("express");
const router = express.Router();
const {
  fetchMerchants,
  // fetchCommunitySummary,
} = require("../controllers/merchants.js");

// Fetch Merchants data from the outsource API
router.post("/fetchMerchants", fetchMerchants);

// // Fetch CommunitySummary data from the outsource API
// router.get("/fetchCommunitySummary", fetchCommunitySummary);

module.exports = router;
