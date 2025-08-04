const express = require("express");
const router = express.Router();
const { fetchOperationsUntilTarget } = require("../controllers/operations.js");

// 🎯 Only advanced "UntilTarget" endpoint
router.post("/fetchOperationsUntilTarget", fetchOperationsUntilTarget);

module.exports = router;
