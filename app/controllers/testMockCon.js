// Controller for test mock endpoints

import TestMockService from "../services/testMock/testMockService.js";

/**
 * Test NEW approach: Fetch first, then truncate (SAFE)
 */
export async function testNewApproachSuccess(req, res) {
  try {
    console.log("\n🧪 ========== TEST 1: NEW APPROACH - SUCCESS SCENARIO ==========");
    const result = await TestMockService.fetchAllTestMock(false);
    
    res.status(200).json({
      success: result.success,
      test: "New Approach - Success",
      result: result,
    });
  } catch (error) {
    console.error("Error in testNewApproachSuccess:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

/**
 * Test NEW approach: API fails (data preserved)
 */
export async function testNewApproachFail(req, res) {
  try {
    console.log("\n🧪 ========== TEST 2: NEW APPROACH - API FAILURE SCENARIO ==========");
    const result = await TestMockService.fetchAllTestMock(true);
    
    res.status(200).json({
      success: result.success,
      test: "New Approach - API Failure",
      result: result,
      note: "Old data should be preserved",
    });
  } catch (error) {
    console.error("Error in testNewApproachFail:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

/**
 * Test OLD approach: Truncate first (DANGEROUS)
 */
export async function testOldApproachSuccess(req, res) {
  try {
    console.log("\n🧪 ========== TEST 3: OLD APPROACH - SUCCESS SCENARIO ==========");
    const result = await TestMockService.fetchAllTestMockOldWay(false);
    
    res.status(200).json({
      success: result.success,
      test: "Old Approach - Success",
      result: result,
    });
  } catch (error) {
    console.error("Error in testOldApproachSuccess:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

/**
 * Test OLD approach: API fails (DATA LOST)
 */
export async function testOldApproachFail(req, res) {
  try {
    console.log("\n🧪 ========== TEST 4: OLD APPROACH - API FAILURE SCENARIO (DANGEROUS) ==========");
    const result = await TestMockService.fetchAllTestMockOldWay(true);
    
    res.status(200).json({
      success: result.success,
      test: "Old Approach - API Failure",
      result: result,
      warning: "⚠️ This demonstrates DATA LOSS when API fails",
    });
  } catch (error) {
    console.error("Error in testOldApproachFail:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

/**
 * Get current count in test_mock table
 */
export async function getTestMockCount(req, res) {
  try {
    const { getTestMockCount } = await import("../services/db/testMockDb.js");
    const count = await getTestMockCount();
    
    res.status(200).json({
      success: true,
      count: count,
      message: `Test mock table has ${count} records`,
    });
  } catch (error) {
    console.error("Error in getTestMockCount:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
