import express from "express";
import { fetchNews } from "../controllers/newsCon.js";

const router = express.Router();

router.post("/fetchNews", fetchNews);

export default router;
