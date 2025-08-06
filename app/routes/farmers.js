const express = require("express");
const router = express.Router();
const { fetchFarmersUntilTarget } = require("../controllers/farmers");

// Main farmers endpoints
router.post("/fetchFarmersUntilTarget", fetchFarmersUntilTarget);

module.exports = router;
