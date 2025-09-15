import express from "express";
import { fetchDurianGardens } from "../controllers/durianGardensCon.js";

const router = express.Router();

router.post("/fetchDurianGardens", fetchDurianGardens);

export default router;
