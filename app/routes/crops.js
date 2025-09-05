import express from "express";
import { fetchCrops } from "../controllers/cropsCon.js";

const router = express.Router();

// ✅ Enable crops endpoint
router.post("/fetchCrops", fetchCrops);

export default router;
