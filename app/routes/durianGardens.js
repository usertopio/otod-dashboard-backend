const express = require("express");
const router = express.Router();
const { fetchDurianGardens } = require("../controllers/durianGardensCon.js");

router.post("/fetchDurianGardens", fetchDurianGardens);

module.exports = router;
