import express from "express";
import { fetchSubstance } from "../controllers/substanceCon.js";

const router = express.Router();

router.post("/fetchSubstance", fetchSubstance);

export default router;
