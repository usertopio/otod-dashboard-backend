const express = require("express");
const router = express.Router();
const { fetchCommunities } = require("../controllers/communities");

// Main communities endpoints
router.post("/fetchCommunities", fetchCommunities);

module.exports = router;
