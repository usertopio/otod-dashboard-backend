const express = require("express");
const router = express.Router();
const { fetchNews } = require("../controllers/newsCon.js");

router.post("/fetchNews", fetchNews);

module.exports = router;
