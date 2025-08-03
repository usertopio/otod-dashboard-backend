const express = require("express");
const router = express.Router();
const { fetchCommunitiesUntilTarget } = require("../controllers/communities");

// Main communities endpoints
router.post("/fetchCommunities", fetchCommunitiesUntilTarget);
router.post("/fetchCommunitiesUntilTarget", fetchCommunitiesUntilTarget);

module.exports = router;
