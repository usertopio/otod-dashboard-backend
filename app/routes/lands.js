const express = require("express");
const router = express.Router();
const { fetchLands } = require("../controllers/lands");

// Fetch Lands data from the outsource API
router.post("/fetchLands", fetchLands);

module.exports = router;
