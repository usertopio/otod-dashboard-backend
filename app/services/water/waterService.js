// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";
import { WATER_CONFIG, STATUS } from "../../utils/constants.js";
import WaterProcessor from "./waterProcessor.js";
import WaterLogger from "./waterLogger.js";

// ===================== Service =====================
// WaterService handles the business logic for fetching, resetting, and managing water records.
export default class WaterService {
  /**
   * 1. Reset only the water table in the database
   * 2. Fetch all water records from API and store in DB (loop with maxAttempts)
   * 3. Log attempt start/results and final results
   * 4. Return summary result object
   * 5. Get database count method
   */

  // 1. Reset only the water table in the database
  static async resetOnlyWaterTable() {
    const connection = connectionDB.promise();
    try {
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchWater`
      );
      console.log("==========================================\n");
      console.log("🧹 Resetting ONLY water table...");
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE water");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.log("✅ Only water table reset - next ID will be 1");
      return { success: true, message: "Only water table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting water table:", error);
      throw error;
    }
  }

  // 2. Fetch all water records from API and store in DB (loop with maxAttempts)
  // 3. Log attempt start/results and final results
  // 4. Return summary result object
  static async fetchAllWater(maxAttempts = WATER_CONFIG.DEFAULT_MAX_ATTEMPTS) {
    await this.resetOnlyWaterTable();

    let attempt = 1;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let hasMoreData = true;

    console.log(`💧 Fetching ALL water records, Max attempts: ${maxAttempts}`);

    while (attempt <= maxAttempts && hasMoreData) {
      WaterLogger.logAttemptStart(attempt, maxAttempts);

      const result = await WaterProcessor.fetchAndProcessData();

      WaterLogger.logAttemptResults(attempt, result);

      totalInserted += result.inserted || 0;
      totalUpdated += result.updated || 0;
      totalErrors += result.errors || 0;

      hasMoreData = (result.inserted || 0) > 0;

      // Early termination for efficiency
      if (
        attempt === 1 &&
        (result.inserted || 0) > 0 &&
        (result.errors || 0) === 0
      ) {
        console.log(
          `✅ First attempt successful with ${result.inserted} records - stopping`
        );
        hasMoreData = false;
      }

      console.log(
        `🔍 Attempt ${attempt}: Inserted ${result.inserted}, Continue: ${hasMoreData}`
      );

      attempt++;
    }

    const finalCount = await this._getDatabaseCount();

    WaterLogger.logFinalResults(
      "ALL",
      finalCount,
      attempt - 1,
      maxAttempts,
      STATUS.SUCCESS
    );

    return {
      message: `Fetch loop completed - ALL records fetched`,
      achieved: finalCount,
      attemptsUsed: attempt - 1,
      maxAttempts: maxAttempts,
      inserted: totalInserted,
      updated: totalUpdated,
      errors: totalErrors,
      status: STATUS.SUCCESS,
      reachedTarget: true,
      table: "water",
    };
  }

  // 5. Get database count method
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM water");
    return result[0].total;
  }
}
