const express = require("express");
const router = express.Router();
const { fetchGap } = require("../controllers/gap.js");

router.post("/fetchGap", fetchGap);

module.exports = router;
