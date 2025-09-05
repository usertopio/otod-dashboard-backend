import express from "express";
import { fetchWater } from "../controllers/waterCon.js";

const router = express.Router();

// Main water endpoints
router.post("/fetchWater", fetchWater);

export default router;
