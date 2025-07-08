const express = require("express");
const router = express.Router();
const {
  fetchCommunities,
  fetchCommunitySummary,
} = require("../controllers/communities.js");

// Fetch Communities data from the outsource API
router.post("/fetchCommunities", fetchCommunities);

// Fetch CommunitySummary data from the outsource API
router.get("/fetchCommunitySummary", fetchCommunitySummary);

module.exports = router;
