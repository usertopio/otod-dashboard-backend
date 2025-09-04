const express = require("express");
const router = express.Router();
const { fetchGap } = require("../controllers/gapCon.js");

router.post("/fetchGap", fetchGap);

module.exports = router;
