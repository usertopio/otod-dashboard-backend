// ===================== Imports =====================
const { connectionDB } = require("../../config/db/db.conf.js");
const { GAP_CONFIG, STATUS } = require("../../utils/constants");
const GapProcessor = require("./gapProcessor");
const GapLogger = require("./gapLogger");

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
   * - Stops early if the target number of records is reached.
   * - Returns a summary result object.
   * @param {number} targetCount - The number of records to fetch and store.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
  static async fetchGap(targetCount, maxAttempts) {
    await this.resetOnlyGapTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    console.log(
      `🎯 Target: ${targetCount} gap certificates, Max attempts: ${maxAttempts}`
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
module.exports = GapService;
