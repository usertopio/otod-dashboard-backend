// ===================== Imports =====================
// Import database connection for executing SQL queries
const { connectionDB } = require("../../config/db/db.conf.js");
// Import configuration constants and status enums
const { FARMERS_CONFIG, STATUS } = require("../../utils/constants");
// Import the processor for handling API data and DB upserts
const FarmersProcessor = require("./farmersProcessor");
// Import the logger for structured logging of the fetch process
const FarmersLogger = require("./farmersLogger");

// ===================== Service =====================
// FarmersService handles the business logic for fetching, resetting, and managing farmer records.
class FarmersService {
  /**
   * Resets only the farmers table in the database.
   * - Disables foreign key checks to allow truncation.
   * - Truncates the farmers table, leaving related tables (gap, operations) untouched.
   * - Re-enables foreign key checks after operation.
   * - Logs the process and returns a status object.
   */
  static async resetOnlyFarmersTable() {
    const connection = connectionDB.promise();

    try {
      // Log the start of the reset operation
      console.log("==========================================");
      console.log(`🔄  Calling API Endpoint: {{LOCAL_HOST}}/api/fetchFarmers`);
      console.log("==========================================\n");

      console.log("🧹 Resetting ONLY farmers table...");

      // Disable foreign key checks to allow truncation
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");

      // Truncate the farmers table (delete all records, reset auto-increment)
      await connection.query("TRUNCATE TABLE farmers");

      // Re-enable foreign key checks after truncation
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      // Log completion
      console.log(
        "✅ Only farmers table reset - gap/operations kept with orphaned references"
      );
      return { success: true, message: "Only farmers table reset" };
    } catch (error) {
      // Always re-enable foreign key checks even if error occurs
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      // Log the error
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
    // Reset the farmers table before fetching new data
    await this.resetOnlyFarmersTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    // Log the fetch target and attempt limit
    console.log(
      `🎯 Target: ${targetCount} farmers, Max attempts: ${maxAttempts}`
    );

    // Main fetch/process loop
    while (attempt <= maxAttempts) {
      // Log the start of this attempt
      FarmersLogger.logAttemptStart(attempt, maxAttempts);

      // Get the current number of farmers in the database
      currentCount = await this._getDatabaseCount();
      FarmersLogger.logCurrentStatus(currentCount, targetCount);

      // Always make an API call and process the data
      attemptsUsed++;
      const result = await FarmersProcessor.fetchAndProcessData();

      // Log detailed metrics for this attempt (inserted, updated, errors, etc.)
      FarmersLogger.logAttemptResults(attempt, result);

      // Update the current count after processing
      currentCount = result.totalAfter;
      attempt++;

      // If we've reached or exceeded the target, log and exit early
      if (currentCount >= targetCount) {
        FarmersLogger.logTargetReached(targetCount, attemptsUsed);
        break;
      }
    }

    // Build and return the final result summary
    return this._buildFinalResult(targetCount, attemptsUsed, maxAttempts);
  }

  /**
   * Returns the current count of farmer records in the database.
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

    // Log the final results (target, achieved, attempts, status)
    FarmersLogger.logFinalResults(
      targetCount,
      finalCount,
      attemptsUsed,
      maxAttempts,
      status
    );

    // Return a summary object
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
// Export the FarmersService class
module.exports = FarmersService;
