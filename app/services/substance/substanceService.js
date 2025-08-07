// ===================== Imports =====================
// Import DB connection for executing SQL queries
const { connectionDB } = require("../../config/db/db.conf.js");
const { SUBSTANCE_CONFIG, STATUS } = require("../../utils/constants");
const SubstanceProcessor = require("./substanceProcessor");
const SubstanceLogger = require("./substanceLogger");

// ===================== Service =====================
// SubstanceService handles the business logic for fetching, resetting, and managing substance records.
class SubstanceService {
  /**
   * Resets only the substance table in the database.
   * - Disables foreign key checks to allow truncation.
   * - Truncates the substance table, leaving related tables untouched.
   * - Re-enables foreign key checks after operation.
   * - Logs the process and returns a status object.
   */
  static async resetOnlySubstanceTable() {
    const connection = connectionDB.promise();

    try {
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchSubstance`
      );
      console.log("==========================================\n");

      console.log("🧹 Resetting ONLY substance table...");

      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE substance");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("✅ Only substance table reset - next ID will be 1");
      return { success: true, message: "Only substance table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting substance table:", error);
      throw error;
    }
  }

  /**
   * Main entry point for fetching substance usage summary from the API and storing it in the database.
   * - Resets the substance table before starting.
   * - Loops up to maxAttempts, fetching and processing data each time.
   * - Logs progress and metrics for each attempt.
   * - Stops early if the target number of records is reached.
   * - Returns a summary result object.
   * @param {number} targetCount - The number of records to fetch and store.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
  static async fetchSubstance(targetCount, maxAttempts) {
    await this.resetOnlySubstanceTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    console.log(
      `🎯 Target: ${targetCount} substance records, Max attempts: ${maxAttempts}`
    );

    while (attempt <= maxAttempts) {
      SubstanceLogger.logAttemptStart(attempt, maxAttempts);

      currentCount = await this._getDatabaseCount();
      SubstanceLogger.logCurrentStatus(currentCount, targetCount);

      attemptsUsed++;
      const result = await SubstanceProcessor.fetchAndProcessData();

      SubstanceLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

      if (currentCount >= targetCount) {
        SubstanceLogger.logTargetReached(targetCount, attemptsUsed);
        break;
      }
    }

    return this._buildFinalResult(targetCount, attemptsUsed, maxAttempts);
  }

  /**
   * Returns the current count of substance records in the database.
   * @returns {Promise<number>} - The total number of substance records in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM substance");
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

    SubstanceLogger.logFinalResults(
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
module.exports = SubstanceService;
