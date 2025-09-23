import express from "express";
import { fetchCommunities } from "../controllers/communitiesCon.js";

const router = express.Router();

router.post("/fetchCommunities", fetchCommunities);

export default router;
