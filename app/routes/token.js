import express from "express";
import {
  getTokenStatus,
  refreshToken,
} from "../controllers/tokenControllerCon.js";

const router = express.Router();

router.get("/status", getTokenStatus);

router.post("/refresh", refreshToken);

export default router;
