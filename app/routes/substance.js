import express from "express";
import { fetchSubstance } from "../controllers/substanceCon.js";

const router = express.Router();

// Main substance endpoints
router.post("/fetchSubstance", fetchSubstance);

export default router;
