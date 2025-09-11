// ===================== Imports =====================
import { connectionDB } from "../../config/db/db.conf.js";
import { FARMERS_CONFIG, STATUS } from "../../utils/constants.js";
import FarmersProcessor from "./farmersProcessor.js";
import FarmersLogger from "./farmersLogger.js";

// ===================== Service =====================
// FarmersService handles the business logic for fetching, resetting, and managing farmer records.
class FarmersService {
  /**
   * Resets only the farmers table in the database.
   * - Disables foreign key checks to allow truncation.
   * - Truncates the farmers table, leaving related tables untouched.
   * - Re-enables foreign key checks after operation.
   * - Logs the process and returns a status object.
   */
  static async resetOnlyFarmersTable() {
    const connection = connectionDB.promise();

    try {
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchFarmers`
      );
      console.log("==========================================\n");

      console.log("🧹 Resetting ONLY farmers table...");

      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE farmers");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("✅ Only farmers table reset - next ID will be 1");
      return { success: true, message: "Only farmers table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting farmers table:", error);
      throw error;
    }
  }

  /**
   * Fetches ALL farmers from the API and stores them in the database.
   * Loops up to maxAttempts, stops early if API returns no new data.
   * Returns a summary result object.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
  static async fetchAllFarmers(
    maxAttempts = FARMERS_CONFIG.DEFAULT_MAX_ATTEMPTS
  ) {
    await this.resetOnlyFarmersTable();

    let attempt = 1;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let hasMoreData = true;

    console.log(`👨‍🌾 Fetching ALL farmers, Max attempts: ${maxAttempts}`);

    while (attempt <= maxAttempts && hasMoreData) {
      FarmersLogger.logAttemptStart(attempt, maxAttempts);

      const result = await FarmersProcessor.fetchAndProcessData();

      FarmersLogger.logAttemptResults(attempt, result);

      totalInserted += result.inserted || 0;
      totalUpdated += result.updated || 0;
      totalErrors += result.errors || 0;

      // IMPROVED: Stop if no new records were inserted AND no updates occurred
      const hasNewData = (result.inserted || 0) > 0;
      const hasUpdates = (result.updated || 0) > 0;

      // Only continue if we got completely new data (inserts)
      // Updates don't count as "new data" for pagination purposes
      hasMoreData = hasNewData;

      console.log(
        `🔍 Attempt ${attempt}: New data: ${hasNewData}, Continue: ${hasMoreData}`
      );

      attempt++;
    }

    const finalCount = await this._getDatabaseCount();

    FarmersLogger.logFinalResults(
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
      table: "farmers",
    };
  }

  /**
   * Returns the current count of farmers records in the database.
   * @returns {Promise<number>} - The total number of farmers in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM farmers");
    return result[0].total;
  }

  /**
   * Builds and logs the final result summary after the fetch loop.
   * @param {number} targetCount - The target number of farmers.
   * @param {number} attemptsUsed - The number of attempts used.
   * @param {number} maxAttempts - The maximum allowed attempts.
   * @returns {object} - Summary of the fetch operation.
   */
  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this._getDatabaseCount();
    let status;

    // ✅ CONSISTENT: All handle "ALL" target correctly
    if (targetCount === "ALL") {
      status = finalCount > 0 ? STATUS.SUCCESS : STATUS.INCOMPLETE;
    } else {
      status = finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;
    }

    FarmersLogger.logFinalResults(
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
export default FarmersService;
