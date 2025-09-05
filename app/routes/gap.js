import express from "express";
import { fetchGap } from "../controllers/gapCon.js";

const router = express.Router();

router.post("/fetchGap", fetchGap);

export default router;
