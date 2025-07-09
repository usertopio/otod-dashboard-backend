const express = require("express");
const router = express.Router();
const {
  fetchOperations,
  fetchOperationSummary,
} = require("../controllers/operations.js");

// Fetch Operations data from the outsource API
router.post("/fetchOperations", fetchOperations);

// Fetch OperationSummary data from the outsource API
router.post("/fetchOperationSummary", fetchOperationSummary);

module.exports = router;
