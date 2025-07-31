const express = require("express");
const router = express.Router();
const { fetchMerchants } = require("../controllers/merchants.js");

// Fetch Merchants data from the outsource API
router.post("/fetchMerchants", fetchMerchants);

module.exports = router;
