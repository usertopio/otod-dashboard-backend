import express from "express";
import { fetchFarmers } from "../controllers/farmersCon.js";

const router = express.Router();

router.post("/fetchFarmers", fetchFarmers);

export default router;
