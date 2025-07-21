const express = require("express");
const router = express.Router();
const {
  fetchNews,
  fetchNewsSummaryByMonth,
} = require("../controllers/news.js");

// Fetch news data from the outsource API
router.post("/fetchNews", fetchNews);

// Fetch GetNewsSummaryByMonth data from the outsource API
router.post("/fetchNewsSummaryByMonth", fetchNewsSummaryByMonth);

module.exports = router;
