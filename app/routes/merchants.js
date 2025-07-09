const express = require("express");
const router = express.Router();
const {
  fetchMerchants,
  fetchMerchantSummary,
} = require("../controllers/merchants.js");

// Fetch Merchants data from the outsource API
router.post("/fetchMerchants", fetchMerchants);

// Fetch MerchantSummary data from the outsource API
router.get("/fetchMerchantSummary", fetchMerchantSummary);

module.exports = router;
