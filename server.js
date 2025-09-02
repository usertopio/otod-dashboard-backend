const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const CronService = require("./app/services/scheduler/cronService");

const { readdirSync } = require("fs");

require("dotenv").config();

// Import app AFTER environment variables are loaded
const app = express();

const PORT = process.env.PORT || 5000;

CronService.init();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

readdirSync("./app/routes").map((r) => {
  app.use("/api", require("./app/routes/" + r));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} 🎉`);
});
