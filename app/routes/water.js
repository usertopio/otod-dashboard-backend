import express from "express";
import { fetchWater } from "../controllers/waterCon.js";

const router = express.Router();

router.post("/fetchWater", fetchWater);

export default router;
