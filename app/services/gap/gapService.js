// ===================== Imports =====================
import { connectionDB } from "../../config/db/db.conf.js";
import { GAP_CONFIG, STATUS } from "../../utils/constants.js";
import GapProcessor from "./gapProcessor.js";
import GapLogger from "./gapLogger.js";

// ===================== Service =====================
// GapService handles the business logic for fetching, resetting, and managing GAP certificate records.
class GapService {
  /**
   * Resets only the gap table in the database.
   * - Disables foreign key checks to allow truncation.
   * - Truncates the gap table, leaving related tables untouched.
   * - Re-enables foreign key checks after operation.
   * - Logs the process and returns a status object.
   */
  static async resetOnlyGapTable() {
    const connection = connectionDB.promise();

    try {
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchGap`
      );
      console.log("==========================================\n");

      console.log("🧹 Resetting ONLY gap table...");

      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE gap");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("✅ Only gap table reset - next ID will be 1");
      return { success: true, message: "Only gap table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting gap table:", error);
      throw error;
    }
  }

  /**
   * Main entry point for fetching GAP certificates from the API and storing them in the database.
   * - Resets the gap table before starting.
   * - Loops up to maxAttempts, fetching and processing data each time.
   * - Logs progress and metrics for each attempt.
   * - Stops early if the target number of certificates is reached.
   * - Returns a summary result object.
   * @param {number} targetCount - The number of GAP certificates to fetch and store.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
  static async fetchGap(targetCount, maxAttempts) {
    await this.resetOnlyGapTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    console.log(
      `🎯 Target: ${targetCount} GAP certificates, Max attempts: ${maxAttempts}`
    );

    while (attempt <= maxAttempts) {
      GapLogger.logAttemptStart(attempt, maxAttempts);

      currentCount = await this._getDatabaseCount();
      GapLogger.logCurrentStatus(currentCount, targetCount);

      attemptsUsed++;
      const result = await GapProcessor.fetchAndProcessData();

      GapLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

      if (currentCount >= targetCount) {
        GapLogger.logTargetReached(targetCount, attemptsUsed);
        break;
      }
    }

    return this._buildFinalResult(targetCount, attemptsUsed, maxAttempts);
  }

  /**
   * Fetches ALL GAP certificates from the API and stores them in the database.
   * Loops up to maxAttempts, stops early if no new records are inserted.
   * Returns a summary result object.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
  static async fetchAllGap(maxAttempts = GAP_CONFIG.DEFAULT_MAX_ATTEMPTS) {
    await this.resetOnlyGapTable();

    let attempt = 1;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let hasMoreData = true;

    console.log(
      `📜 Fetching ALL GAP certificates, Max attempts: ${maxAttempts}`
    );

    while (attempt <= maxAttempts && hasMoreData) {
      GapLogger.logAttemptStart(attempt, maxAttempts);

      const result = await GapProcessor.fetchAndProcessData();

      GapLogger.logAttemptResults(attempt, result);

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

    GapLogger.logFinalResults(
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
      table: "gap",
    };
  }

  /**
   * Returns the current count of gap records in the database.
   * @returns {Promise<number>} - The total number of gap certificates in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM gap");
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

    GapLogger.logFinalResults(
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
export default GapService;
