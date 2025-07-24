const express = require("express");
const router = express.Router();
const { fetchLandGeoJSON } = require("../controllers/landGeoJSON");

router.post("/fetchLandGeoJSON", fetchLandGeoJSON);

module.exports = router;
