const express = require("express");
const router = express.Router();
const { fetchSubstanceUntilTarget } = require("../controllers/substance");

// Main substance endpoints
router.post("/fetchSubstanceUntilTarget", fetchSubstanceUntilTarget);

module.exports = router;
