import express from "express";
import morgan from "morgan";
import cors from "cors";
import { readdirSync } from "fs";
import { config } from "dotenv";
import CronService from "./app/services/scheduler/cronService.js";

config();

const app = express();
const PORT = process.env.PORT;

CronService.init();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Dynamic route loading with ES modules
const routeFiles = readdirSync("./app/routes");
for (const routeFile of routeFiles) {
  const route = await import(`./app/routes/${routeFile}`);
  app.use("/api", route.default);
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} 🎉`);
});
