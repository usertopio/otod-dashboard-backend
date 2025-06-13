const express = require("express");
const router = express.Router();

router.get("/users", (req, res) => {
  //   connection.query("SELECT * FROM `users`", (error, ressuts) => {
  //     res.json(results);
  //   });
  res.json({ message: "Users fetched successfully" });
  console.log("Fetching users");
});

module.exports = router;
