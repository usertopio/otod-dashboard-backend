const express = require("express");
const router = express.Router();
const { fetchFarmers } = require("../controllers/farmers");

router.post("/fetchFarmers", fetchFarmers);

module.exports = router;
