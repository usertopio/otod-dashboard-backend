const express = require("express");
const router = express.Router();
const {
  fetchFarmers,
  fetchFarmersUntilTarget,
  resetFarmersTable,
} = require("../controllers/farmers");

// Original single fetch
router.post("/fetchFarmers", fetchFarmers);

// New looping fetch until target
router.post("/fetchFarmersUntilTarget", fetchFarmersUntilTarget);

// Reset farmers table
router.post("/resetFarmers", resetFarmersTable);

module.exports = router;
