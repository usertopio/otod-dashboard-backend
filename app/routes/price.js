import express from "express";
import { fetchAvgPrice } from "../controllers/priceCon.js";

const router = express.Router();

router.post("/fetchAvgPrice", fetchAvgPrice);

export default router;
