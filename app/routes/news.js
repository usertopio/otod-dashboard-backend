const express = require("express");
const router = express.Router();
const { fetchNews } = require("../controllers/news.js");

// Fetch news data from the outsource API
router.post("/fetchNews", fetchNews);

module.exports = router;
