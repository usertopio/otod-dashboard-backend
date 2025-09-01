const express = require("express");
const router = express.Router();
const { fetchOperations } = require("../controllers/operationsCon.js");

router.post("/fetchOperations", fetchOperations);

module.exports = router;
