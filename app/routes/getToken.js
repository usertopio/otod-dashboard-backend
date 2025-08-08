const express = require("express");
const { getToken } = require("../controllers/login");
const router = express.Router();

// Get access token from the outsource API
router.post("/getToken", getToken);

module.exports = router;
