import express from "express";
import { getToken } from "../controllers/loginCon.js";

const router = express.Router();

router.post("/getToken", getToken);

export default router;
