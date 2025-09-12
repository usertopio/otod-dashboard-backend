import express from "express";
import { fetchAvgPrice } from "../controllers/avgPriceCon.js";

const router = express.Router();

router.post("/fetchAvgPrice", fetchAvgPrice);

export default router;
