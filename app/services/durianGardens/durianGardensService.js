// ===================== Imports =====================
// Import DB connection for executing SQL queries
const { connectionDB } = require("../../config/db/db.conf.js");
// Import configuration constants and status enums
const { DURIAN_GARDENS_CONFIG, STATUS } = require("../../utils/constants");
// Import the processor for handling API data and DB upserts
const DurianGardensProcessor = require("./durianGardensProcessor");
// Import the logger for structured logging of the fetch process
const DurianGardensLogger = require("./durianGardensLogger");

// ===================== Service =====================
// DurianGardensService handles the business logic for fetching, resetting, and managing durian garden records.
class DurianGardensService {
  /**
   * Resets only the durian_gardens table in the database.
   * - Disables foreign key checks to allow truncation.
   * - Truncates the durian_gardens table, leaving related tables untouched.
   * - Re-enables foreign key checks after operation.
   * - Logs the process and returns a status object.
   */
  static async resetOnlyDurianGardensTable() {
    const connection = connectionDB.promise();

    try {
      // Log the start of the reset operation
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchDurianGardens`
      );
      console.log("==========================================\n");

      console.log("🧹 Resetting ONLY durian_gardens table...");

      // Disable foreign key checks to allow truncation
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");

      // Truncate the durian_gardens table (delete all records, reset auto-increment)
      await connection.query("TRUNCATE TABLE durian_gardens");

      // Re-enable foreign key checks after truncation
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      // Log completion
      console.log("✅ Only durian_gardens table reset - next ID will be 1");
      return { success: true, message: "Only durian_gardens table reset" };
    } catch (error) {
      // Always re-enable foreign key checks even if error occurs
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      // Log the error
      console.error("❌ Error resetting durian_gardens table:", error);
      throw error;
    }
  }

  /**
   * Main entry point for fetching durian gardens from APIs and storing them in the database.
   * - Resets the durian_gardens table before starting.
   * - Loops up to maxAttempts, fetching and processing data each time.
   * - Logs progress and metrics for each attempt.
   * - Stops early if the target number of gardens is reached.
   * - Returns a summary result object.
   * @param {number} targetCount - The number of gardens to fetch and store.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
  static async fetchDurianGardens(targetCount, maxAttempts) {
    // Reset the durian_gardens table before fetching new data
    await this.resetOnlyDurianGardensTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    // Log the fetch target and attempt limit
    console.log(
      `🌿 Target: ${targetCount} durian gardens (GetLands + GetLandGeoJSON), Max attempts: ${maxAttempts}`
    );

    // Main fetch/process loop
    while (attempt <= maxAttempts) {
      DurianGardensLogger.logAttemptStart(attempt, maxAttempts);

      currentCount = await this._getDatabaseCount();
      DurianGardensLogger.logCurrentStatus(
        currentCount,
        targetCount,
        "durian gardens (from both APIs)"
      );

      attemptsUsed++;
      const result = await DurianGardensProcessor.fetchAndProcessData();

      DurianGardensLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

      if (currentCount >= targetCount) {
        DurianGardensLogger.logTargetReached(targetCount, attemptsUsed);
        break;
      }
    }

    return this._buildFinalResult(targetCount, attemptsUsed, maxAttempts);
  }

  /**
   * Fetches ALL durian gardens from both APIs and stores them in the database.
   * Loops up to maxAttempts, stops early if no new records are inserted.
   * Returns a summary result object.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
  static async fetchAllDurianGardens(
    maxAttempts = DURIAN_GARDENS_CONFIG.DEFAULT_MAX_ATTEMPTS
  ) {
    await this.resetOnlyDurianGardensTable();

    let attempt = 1;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let hasMoreData = true;

    console.log(`🌿 Fetching ALL durian gardens, Max attempts: ${maxAttempts}`);

    while (attempt <= maxAttempts && hasMoreData) {
      DurianGardensLogger.logAttemptStart(attempt, maxAttempts);

      const result = await DurianGardensProcessor.fetchAndProcessData();

      DurianGardensLogger.logAttemptResults(attempt, result);

      totalInserted += result.inserted || 0;
      totalUpdated += result.updated || 0;
      totalErrors += result.errors || 0;

      // Only continue if new records were inserted in this attempt
      hasMoreData = (result.inserted || 0) > 0;
      attempt++;
    }

    const finalCount = await this._getDatabaseCount();

    DurianGardensLogger.logFinalResults(
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
      apis: ["GetLands", "GetLandGeoJSON"],
      table: "durian_gardens",
    };
  }

  /**
   * Returns the current count of durian_gardens records in the database.
   * @returns {Promise<number>} - The total number of gardens in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM durian_gardens");
    return result[0].total;
  }

  /**
   * Builds and logs the final result summary after the fetch loop.
   * @param {number} targetCount - The target number of gardens.
   * @param {number} attemptsUsed - The number of attempts used.
   * @param {number} maxAttempts - The maximum allowed attempts.
   * @returns {object} - Summary of the fetch operation.
   */
  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this._getDatabaseCount();
    const status =
      finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;

    DurianGardensLogger.logFinalResults(
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
      apis: ["GetLands", "GetLandGeoJSON"],
      table: "durian_gardens",
    };
  }
}

// ===================== Exports =====================
// Export the DurianGardensService class for use in controllers and routes
module.exports = DurianGardensService;
