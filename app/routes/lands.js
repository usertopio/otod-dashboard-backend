const express = require("express");
const router = express.Router();
const { fetchLands, fetchLandSummary } = require("../controllers/lands");

// Fetch Lands data from the outsource API
router.post("/fetchLands", fetchLands);

// Fetch Land Summary data from the outsource API
router.get("/fetchLandSummary", fetchLandSummary);

module.exports = router;
