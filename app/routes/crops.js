const express = require("express");
const router = express.Router();

// 🔧 TEMPORARILY DISABLED - Need durian_gardens data first
// const { fetchCropsUntilTarget } = require("../controllers/crops.js");

// 🔧 Temporary endpoint that explains the situation
router.post("/fetchCropsUntilTarget", (req, res) => {
  res.status(503).json({
    message: "Crops endpoint temporarily disabled",
    reason: "Need durian_gardens data first due to foreign key constraints",
    recommendation:
      "Please populate durian_gardens table first, then crops will work",
    status: "TEMPORARILY_DISABLED",
  });
});

module.exports = router;
