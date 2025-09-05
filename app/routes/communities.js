import express from "express";
import { fetchCommunities } from "../controllers/communitiesCon.js";

const router = express.Router();

// Main communities endpoints
router.post("/fetchCommunities", fetchCommunities);

export default router;
