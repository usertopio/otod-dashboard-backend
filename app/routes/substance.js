const express = require("express");
const router = express.Router();
const { fetchSubstance } = require("../controllers/substance");

// Main substance endpoints
router.post("/fetchSubstance", fetchSubstance);

module.exports = router;
