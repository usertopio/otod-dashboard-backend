const express = require("express");
const router = express.Router();
const { getFarmers } = require("../controllers/farmers");

router.post("/fetchFarmers", getFarmers);

module.exports = router;
