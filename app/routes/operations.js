import express from "express";
import { fetchOperations } from "../controllers/operationsCon.js";

const router = express.Router();

router.post("/fetchOperations", fetchOperations);

export default router;
