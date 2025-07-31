const express = require("express");
const router = express.Router();
const { fetchOperations } = require("../controllers/operations.js");

// Fetch Operations data from the outsource API
router.post("/fetchOperations", fetchOperations);

module.exports = router;
