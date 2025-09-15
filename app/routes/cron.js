import express from "express";
import {
  triggerManualFetch,
  getCronStatus,
} from "../controllers/cronController.js";

const router = express.Router();

// Get cron status
router.get("/status", getCronStatus);

// Manual trigger
router.post("/trigger", triggerManualFetch);

export default router;
