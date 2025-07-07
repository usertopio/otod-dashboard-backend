const express = require("express");
const router = express.Router();
const { fetchLands, fetchLandSummary } = require("../controllers/Lands");

// Fetch Lands data from the outsource API
router.post("/fetchLands", fetchLands);

// Fetch Land Summary data from the outsource API
router.get("/fetchLandSummary", fetchLandSummary);

module.exports = router;
