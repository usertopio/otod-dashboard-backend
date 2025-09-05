import express from "express";
import {
  getTokenStatus,
  refreshToken,
} from "../controllers/tokenControllerCon.js";

const router = express.Router();

// Get token status
router.get("/status", getTokenStatus);

// Force refresh token
router.post("/refresh", refreshToken);

export default router;
