// ===================== Imports =====================
import { connectionDB } from "../../config/db/db.conf.js";
import { OPERATIONS_CONFIG, STATUS } from "../../utils/constants.js";
import OperationsProcessor from "./operationsProcessor.js";
import OperationsLogger from "./operationsLogger.js";
import { bulkInsertOrUpdateOperations } from "../db/operationsDb.js";

// ===================== Service =====================
// OperationsService handles the business logic for fetching, resetting, and managing operation records.
export default class OperationsService {
  /**
   * 1. Reset only the operations table in the database
   * 2. Fetch all operations from API and store in DB (loop with maxAttempts)
   * 3. Log attempt start/results and final results
   * 4. Return summary result object
   * 5. Get database count method
   */

  // 1. Reset only the operations table in the database
  static async resetOnlyOperationsTable() {
    const connection = connectionDB.promise();
    try {
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchOperations`
      );
      console.log("==========================================\n");
      console.log("🧹 Resetting ONLY operations table...");
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE operations");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.log("✅ Only operations table reset - next ID will be 1");
      return { success: true, message: "Only operations table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting operations table:", error);
      throw error;
    }
  }

  // 2. Fetch all operations from API and store in DB (NEW APPROACH)
  // 3. Log attempt start/results and final results
  // 4. Return summary result object
  static async fetchAllOperations(
    maxAttempts = OPERATIONS_CONFIG.DEFAULT_MAX_ATTEMPTS
  ) {
    console.log("==========================================");
    console.log("📩 NEW APPROACH: Fetch first, validate, then truncate");
    console.log("==========================================\n");

    const countBefore = await this._getDatabaseCount();
    console.log(`📊 Current records in database: ${countBefore}`);

    // STEP 1: Fetch data from API (NO DB changes yet)
    console.log("📡 STEP 1: Fetching data from API...");
    const result = await OperationsProcessor.fetchAndProcessData();

    // STEP 2: Validate fetch result
    if (!result.success || result.recordCount === 0) {
      console.log("❌ STEP 2: Fetch failed or no data received");
      console.log("⚠️  Table NOT truncated - preserving existing data");
      
      return {
        message: "API fetch failed - table NOT truncated",
        countBefore: countBefore,
        countAfter: countBefore,
        inserted: 0,
        updated: 0,
        errors: 1,
        status: STATUS.FAILED,
        oldDataPreserved: true,
      };
    }

    // STEP 3: Fetch succeeded - NOW safe to truncate
    console.log(`✅ STEP 3: Fetch successful with ${result.recordCount} records`);
    console.log("🧹 STEP 4: NOW safe to reset table...");
    await this.resetOnlyOperationsTable();

    // STEP 5: Insert the new data
    console.log("💾 STEP 5: Inserting new data...");
    const insertResult = await bulkInsertOrUpdateOperations(result.data);

    const countAfter = await this._getDatabaseCount();

    OperationsLogger.logFinalResults("ALL", countAfter, 1, maxAttempts, STATUS.SUCCESS);

    return {
      message: "Fetch-first approach succeeded",
      countBefore: countBefore,
      countAfter: countAfter,
      inserted: insertResult.inserted || 0,
      updated: insertResult.updated || 0,
      errors: insertResult.errors || 0,
      status: STATUS.SUCCESS,
      oldDataPreserved: false,
      achieved: countAfter,
      attemptsUsed: 1,
      maxAttempts: maxAttempts,
      reachedTarget: true,
      table: "operations",
    };
  }

  // 5. Get database count method
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM operations");
    return result[0].total;
  }
}
