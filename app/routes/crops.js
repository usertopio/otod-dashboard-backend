import express from "express";
import { fetchCrops } from "../controllers/cropsCon.js";

const router = express.Router();

router.post("/fetchCrops", fetchCrops);

export default router;
