// ===================== Imports =====================
// Import DB connection for executing SQL queries
const { connectionDB } = require("../../config/db/db.conf.js");
// Import configuration constants and status enums
const { MERCHANTS_CONFIG, STATUS } = require("../../utils/constants");
// Import the processor for handling API data and DB upserts
const MerchantsProcessor = require("./merchantsProcessor");
// Import the logger for structured logging of the fetch process
const MerchantsLogger = require("./merchantsLogger");

// ===================== Service =====================
// MerchantsService handles the business logic for fetching, resetting, and managing merchant records.
class MerchantsService {
  /**
   * Resets only the merchants table in the database.
   * - Disables foreign key checks to allow truncation.
   * - Truncates the merchants table, leaving related tables untouched.
   * - Re-enables foreign key checks after operation.
   * - Logs the process and returns a status object.
   */
  static async resetOnlyMerchantsTable() {
    const connection = connectionDB.promise();

    try {
      // Log the start of the reset operation
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchMerchants`
      );
      console.log("==========================================\n");

      console.log("🧹 Resetting ONLY merchants table...");

      // Disable foreign key checks to allow truncation
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      // Truncate the merchants table (delete all records, reset auto-increment)
      await connection.query("TRUNCATE TABLE merchants");
      // Re-enable foreign key checks after truncation
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      // Log completion
      console.log("✅ Only merchants table reset - next ID will be 1");
      return { success: true, message: "Only merchants table reset" };
    } catch (error) {
      // Always re-enable foreign key checks even if error occurs
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      // Log the error
      console.error("❌ Error resetting merchants table:", error);
      throw error;
    }
  }

  /**
   * Main entry point for fetching merchants from APIs and storing them in the database.
   * - Resets the merchants table before starting.
   * - Loops up to maxAttempts, fetching and processing data each time.
   * - Logs progress and metrics for each attempt.
   * - Stops early if the target number of merchants is reached.
   * - Returns a summary result object.
   * @param {number} targetCount - The number of merchants to fetch and store.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
  static async fetchMerchants(targetCount, maxAttempts) {
    await this.resetOnlyMerchantsTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    // Log the fetch target and attempt limit
    console.log(
      `🎯 Target: ${targetCount} merchants, Max attempts: ${maxAttempts}`
    );

    while (attempt <= maxAttempts) {
      MerchantsLogger.logAttemptStart(attempt, maxAttempts);

      currentCount = await this._getDatabaseCount();
      MerchantsLogger.logCurrentStatus(currentCount, targetCount);

      attemptsUsed++;
      const result = await MerchantsProcessor.fetchAndProcessData();

      MerchantsLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

      if (currentCount >= targetCount) {
        MerchantsLogger.logTargetReached(targetCount, attemptsUsed);
        break;
      }
    }

    return this._buildFinalResult(targetCount, attemptsUsed, maxAttempts);
  }

  /**
   * Returns the current count of merchant records in the database.
   * @returns {Promise<number>} - The total number of merchants in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM merchants");
    return result[0].total;
  }

  /**
   * Builds and logs the final result summary after the fetch loop.
   * @param {number} targetCount - The target number of merchants.
   * @param {number} attemptsUsed - The number of attempts used.
   * @param {number} maxAttempts - The maximum allowed attempts.
   * @returns {object} - Summary of the fetch operation.
   */
  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this._getDatabaseCount();
    const status =
      finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;

    MerchantsLogger.logFinalResults(
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
// Export the MerchantsService class for use in controllers and routes
module.exports = MerchantsService;
