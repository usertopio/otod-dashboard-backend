const express = require("express");
const router = express.Router();
const { fetchCommunities } = require("../controllers/communities.js");

// Fetch Lands data from the outsource API
router.post("/fetchCommunities", fetchCommunities);

module.exports = router;
