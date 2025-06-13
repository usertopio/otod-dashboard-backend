const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const { readdirSync } = require("fs");

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

readdirSync("./app/routes").map((r) => {
  app.use("/api", require("./app/routes/" + r));
});

app.listen(5000, () => {
  console.log("Server is running on port 5000 🎉");
});
