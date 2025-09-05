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
   * Main entry point for fetching farmers from the API and storing them in the database.
   * - Resets the farmers table before starting.
   * - Loops up to maxAttempts, fetching and processing data each time.
   * - Logs progress and metrics for each attempt.
   * - Stops early if the target number of farmers is reached.
   * - Returns a summary result object.
   * @param {number} targetCount - The number of farmers to fetch and store.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
  static async fetchFarmers(targetCount, maxAttempts) {
    await this.resetOnlyFarmersTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    console.log(
      `🎯 Target: ${targetCount} farmers, Max attempts: ${maxAttempts}`
    );

    while (attempt <= maxAttempts) {
      FarmersLogger.logAttemptStart(attempt, maxAttempts);

      currentCount = await this._getDatabaseCount();
      FarmersLogger.logCurrentStatus(currentCount, targetCount);

      attemptsUsed++;
      const result = await FarmersProcessor.fetchAndProcessData();

      FarmersLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

      if (currentCount >= targetCount) {
        FarmersLogger.logTargetReached(targetCount, attemptsUsed);
        break;
      }
    }

    return this._buildFinalResult(targetCount, attemptsUsed, maxAttempts);
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

      // Only continue if new records were inserted in this attempt
      hasMoreData = (result.inserted || 0) > 0;
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
    const status =
      finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;

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
