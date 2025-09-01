const express = require("express");
const router = express.Router();
const { fetchCommunities } = require("../controllers/communitiesCon");

// Main communities endpoints
router.post("/fetchCommunities", fetchCommunities);

module.exports = router;
