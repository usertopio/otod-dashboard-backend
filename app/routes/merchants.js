import express from "express";
import { fetchMerchants } from "../controllers/merchantsCon.js";

const router = express.Router();

router.post("/fetchMerchants", fetchMerchants);

export default router;
