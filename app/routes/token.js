const express = require("express");
const {
  getTokenStatus,
  refreshToken,
} = require("../controllers/tokenControllerCon.js");
const router = express.Router();

// Get token status
router.get("/status", getTokenStatus);

// Force refresh token
router.post("/refresh", refreshToken);

module.exports = router;
