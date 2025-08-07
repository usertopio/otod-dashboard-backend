const express = require("express");
const router = express.Router();
const { fetchNews } = require("../controllers/news.js");

router.post("/fetchNews", fetchNews);

module.exports = router;
