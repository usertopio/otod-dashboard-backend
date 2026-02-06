// Routes for test mock endpoints

import { Router } from "express";
import {
  testNewApproachSuccess,
  testNewApproachFail,
  testOldApproachSuccess,
  testOldApproachFail,
  getTestMockCount,
} from "../controllers/testMockCon.js";

const router = Router();

// Test endpoints
router.post("/testNewApproachSuccess", testNewApproachSuccess);
router.post("/testNewApproachFail", testNewApproachFail);
router.post("/testOldApproachSuccess", testOldApproachSuccess);
router.post("/testOldApproachFail", testOldApproachFail);
router.get("/testMockCount", getTestMockCount);

export default router;
