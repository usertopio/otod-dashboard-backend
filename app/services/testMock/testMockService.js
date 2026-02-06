// Test Mock Service - NEW APPROACH: Fetch First, Then Truncate
// This demonstrates the safer pattern to prevent data loss

import { connectionDB } from "../../config/db/db.conf.js";
import TestMockProcessor from "./testMockProcessor.js";
import TestMockLogger from "./testMockLogger.js";
import { bulkInsertOrUpdateTestMock, getTestMockCount, resetTestMockTable } from "../db/testMockDb.js";

export default class TestMockService {
  /**
   * Reset test_mock table (only called AFTER successful fetch)
   */
  static async resetTable() {
    try {
      console.log("🧹 Resetting test_mock table...");
      await resetTestMockTable();
      console.log("✅ Table reset - next ID will be 1");
      TestMockLogger.logTableResetExecuted();
      return { success: true };
    } catch (error) {
      console.error("❌ Error resetting table:", error);
      throw error;
    }
  }

  /**
   * Get current database count
   */
  static async _getDatabaseCount() {
    return await getTestMockCount();
  }

  /**
   * NEW APPROACH: Fetch all test mock data
   * 1. Fetch from API FIRST
   * 2. Validate data exists
   * 3. Reset table ONLY if fetch succeeded
   * 4. Insert new data
   */
  static async fetchAllTestMock(shouldFail = false, maxAttempts = 1) {
    console.log("==========================================");
    console.log("📩 TEST MOCK - NEW APPROACH: Fetch First, Then Truncate");
    console.log("==========================================\n");

    // Get count BEFORE any operations
    const countBefore = await this._getDatabaseCount();
    console.log(`📊 Current records in database: ${countBefore}`);

    let attempt = 1;
    let hasMoreData = true;

    console.log(`🧪 Testing with shouldFail=${shouldFail}`);
    console.log(`🔄 Starting fetch process, Max attempts: ${maxAttempts}\n`);

    while (attempt <= maxAttempts && hasMoreData) {
      TestMockLogger.logAttemptStart(attempt, maxAttempts);

      // STEP 1: Fetch data from API (NO DB changes yet)
      console.log("📡 STEP 1: Fetching data from API...");
      const fetchResult = await TestMockProcessor.fetchAndProcessData(shouldFail);

      // STEP 2: Check if fetch was successful
      if (!fetchResult.success) {
        console.log("❌ STEP 2: Fetch FAILED");
        TestMockLogger.logDataFetchFailure(new Error(fetchResult.error || "Unknown error"));
        TestMockLogger.logTableResetSkipped();
        
        const countAfter = await this._getDatabaseCount();
        console.log(`📊 Final records in database: ${countAfter} (unchanged)`);
        
        return {
          success: false,
          message: "API fetch failed - table NOT truncated",
          oldDataPreserved: true,
          countBefore: countBefore,
          countAfter: countAfter,
          dataLost: false,
        };
      }

      // STEP 3: Check if data exists
      if (fetchResult.noData || fetchResult.recordCount === 0) {
        console.log("⚠️  STEP 3: No data received from API");
        TestMockLogger.logNoDataReceived();
        TestMockLogger.logTableResetSkipped();
        
        const countAfter = await this._getDatabaseCount();
        console.log(`📊 Final records in database: ${countAfter} (unchanged)`);
        
        return {
          success: false,
          message: "No data from API - table NOT truncated",
          oldDataPreserved: true,
          countBefore: countBefore,
          countAfter: countAfter,
          dataLost: false,
        };
      }

      // STEP 4: Fetch succeeded with data - NOW safe to truncate
      console.log(`✅ STEP 4: Fetch successful with ${fetchResult.recordCount} records`);
      TestMockLogger.logDataFetchSuccess(fetchResult.recordCount);
      
      console.log("🧹 STEP 5: NOW safe to reset table...");
      await this.resetTable();

      // STEP 5: Insert the new data
      console.log("💾 STEP 6: Inserting new data...");
      const insertResult = await bulkInsertOrUpdateTestMock(fetchResult.data);

      TestMockLogger.logAttemptResults(attempt, insertResult);

      hasMoreData = false; // Only one attempt for this test

      const countAfter = await this._getDatabaseCount();
      
      TestMockLogger.logFinalResults(
        "ALL",
        countAfter,
        attempt,
        maxAttempts,
        "SUCCESS"
      );

      console.log("\n🎯 === COMPARISON ===");
      console.log(`📊 Before: ${countBefore} records`);
      console.log(`📊 After: ${countAfter} records`);
      console.log(`📊 Change: ${countAfter - countBefore > 0 ? '+' : ''}${countAfter - countBefore}`);

      return {
        success: true,
        message: "Fetch-first approach succeeded",
        oldDataPreserved: false,
        countBefore: countBefore,
        countAfter: countAfter,
        inserted: insertResult.inserted,
        updated: insertResult.updated,
        dataLost: false,
      };
    }
  }

  /**
   * OLD APPROACH: For comparison (truncate first, then fetch)
   * THIS IS DANGEROUS - included only for demonstration
   */
  static async fetchAllTestMockOldWay(shouldFail = false) {
    console.log("==========================================");
    console.log("📩 TEST MOCK - OLD APPROACH: Truncate First (DANGEROUS)");
    console.log("==========================================\n");

    const countBefore = await this._getDatabaseCount();
    console.log(`📊 Current records in database: ${countBefore}`);

    console.log(`🧪 Testing with shouldFail=${shouldFail}\n`);

    // OLD WAY: Truncate FIRST (DANGEROUS!)
    console.log("🧹 STEP 1: Truncating table FIRST...");
    await this.resetTable();
    console.log("⚠️  Data deleted - no turning back now!");

    // STEP 2: Try to fetch (might fail!)
    console.log("📡 STEP 2: Attempting to fetch from API...");
    const fetchResult = await TestMockProcessor.fetchAndProcessData(shouldFail);

    if (!fetchResult.success || fetchResult.recordCount === 0) {
      console.log("❌ STEP 3: Fetch FAILED or no data");
      console.log("💥 RESULT: Table is now EMPTY - data lost!");
      
      const countAfter = await this._getDatabaseCount();
      
      return {
        success: false,
        message: "API fetch failed - table was already truncated",
        oldDataPreserved: false,
        countBefore: countBefore,
        countAfter: countAfter,
        dataLost: true,
        lostRecords: countBefore,
      };
    }

    // If fetch succeeded, insert data
    console.log(`✅ STEP 3: Fetch successful with ${fetchResult.recordCount} records`);
    const insertResult = await bulkInsertOrUpdateTestMock(fetchResult.data);
    
    const countAfter = await this._getDatabaseCount();

    console.log("\n🎯 === COMPARISON ===");
    console.log(`📊 Before: ${countBefore} records`);
    console.log(`📊 After: ${countAfter} records`);
    console.log(`📊 Change: ${countAfter - countBefore > 0 ? '+' : ''}${countAfter - countBefore}`);

    return {
      success: true,
      message: "Old approach succeeded (got lucky)",
      oldDataPreserved: false,
      countBefore: countBefore,
      countAfter: countAfter,
      inserted: insertResult.inserted,
      dataLost: true, // Still counts as data lost since old data was removed
      lostRecords: countBefore,
    };
  }
}
