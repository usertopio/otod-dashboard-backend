const express = require("express");
const router = express.Router();
const { fetchNewsUntilTarget } = require("../controllers/news.js");

// 🎯 ONLY: Fetch news until target reached
router.post("/fetchNewsUntilTarget", fetchNewsUntilTarget);

module.exports = router;
