import express from "express";
import { getToken } from "../controllers/loginCon.js";

const router = express.Router();

// Get access token from the outsource API
router.post("/getToken", getToken);

export default router;
