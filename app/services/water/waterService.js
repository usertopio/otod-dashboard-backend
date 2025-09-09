// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";
import { WATER_CONFIG, STATUS } from "../../utils/constants.js";
import WaterProcessor from "./waterProcessor.js";
import WaterLogger from "./waterLogger.js";

// ===================== Service =====================
// WaterService handles the business logic for fetching, resetting, and managing water records.
class WaterService {
  /**
   * Resets only the water table in the database.
   * - Disables foreign key checks to allow truncation.
   * - Truncates the water table, leaving related tables untouched.
   * - Re-enables foreign key checks after operation.
   * - Logs the process and returns a status object.
   */
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

  /**
   * Main entry point for fetching ALL water usage summary from the API and storing it in the database.
   * - Resets the water table before starting.
   * - Loops up to maxAttempts, fetching and processing data each time.
   * - Logs progress and metrics for each attempt.
   * - Stops early if no new records are inserted.
   * - Returns a summary result object.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
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

      // ✅ STANDARD TERMINATION: Same as other modules
      hasMoreData = (result.inserted || 0) > 0;

      // ✅ ADD: Early termination for efficiency
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

  /**
   * Returns the current count of water records in the database.
   * @returns {Promise<number>} - The total number of water records in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM water");
    return result[0].total;
  }

  /**
   * Builds and logs the final result summary after the fetch loop.
   * @param {number} targetCount - The target number of records.
   * @param {number} attemptsUsed - The number of attempts used.
   * @param {number} maxAttempts - The maximum allowed attempts.
   * @returns {object} - Summary of the fetch operation.
   */
  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this._getDatabaseCount();
    const status =
      finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;

    WaterLogger.logFinalResults(
      targetCount,
      finalCount,
      attemptsUsed,
      maxAttempts,
      status
    );

    return {
      message: `Fetch loop completed - ${status}`,
      target: targetCount,
      achieved: finalCount,
      attemptsUsed: attemptsUsed,
      maxAttempts: maxAttempts,
      status: status,
      reachedTarget: finalCount >= targetCount,
    };
  }
}

// ===================== Exports =====================
export default WaterService;
