const express = require("express");
const {
  triggerManualFetch,
  getCronStatus,
} = require("../controllers/cronController");
const router = express.Router();

// Get cron status
router.get("/status", getCronStatus);

// Manual trigger
router.post("/trigger", triggerManualFetch);

module.exports = router;
