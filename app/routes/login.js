const express = require("express");
const { toLogin } = require("../controllers/login");
const router = express.Router();

// Get access token from the outsource API
router.post("/toLogin", toLogin);

module.exports = router;
