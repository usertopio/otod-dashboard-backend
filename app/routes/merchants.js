const express = require("express");
const router = express.Router();
const { fetchMerchants } = require("../controllers/merchantsCon.js");

router.post("/fetchMerchants", fetchMerchants);

module.exports = router;
