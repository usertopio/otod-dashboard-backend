// ===================== Imports =====================
// Import DB connection for executing SQL queries
const { connectionDB } = require("../../config/db/db.conf.js");
// Import configuration constants and status enums
const { COMMUNITIES_CONFIG, STATUS } = require("../../utils/constants");
// Import the processor for handling API data and DB upserts
const CommunitiesProcessor = require("./communitiesProcessor");
// Import the logger for structured logging of the fetch process
const CommunitiesLogger = require("./communitiesLogger");

// ===================== Service =====================
// CommunitiesService handles the business logic for fetching, resetting, and managing community records.
class CommunitiesService {
  /**
   * Resets only the communities table in the database.
   * - Disables foreign key checks to allow truncation.
   * - Truncates the communities table, leaving related tables untouched.
   * - Re-enables foreign key checks after operation.
   * - Logs the process and returns a status object.
   */
  static async resetOnlyCommunitiesTable() {
    const connection = connectionDB.promise();

    try {
      // Log the start of the reset operation
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchCommunities`
      );
      console.log("==========================================\n");

      console.log("🧹 Resetting ONLY communities table...");

      // Disable foreign key checks to allow truncation
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      // Truncate the communities table (delete all records, reset auto-increment)
      await connection.query("TRUNCATE TABLE communities");
      // Re-enable foreign key checks after truncation
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      // Log completion
      console.log("✅ Only communities table reset - next ID will be 1");
      return { success: true, message: "Only communities table reset" };
    } catch (error) {
      // Always re-enable foreign key checks even if error occurs
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      // Log the error
      console.error("❌ Error resetting communities table:", error);
      throw error;
    }
  }

  /**
   * Main entry point for fetching ALL communities from APIs and storing them in the database.
   * - Resets the communities table before starting.
   * - Loops up to maxAttempts, fetching and processing data each time.
   * - Logs progress and metrics for each attempt.
   * - Stops early if no new records are inserted.
   * - Returns a summary result object.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
  static async fetchAllCommunities(
    maxAttempts = COMMUNITIES_CONFIG.DEFAULT_MAX_ATTEMPTS
  ) {
    await this.resetOnlyCommunitiesTable();

    let attempt = 1;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let hasMoreData = true;

    console.log(`🏘️ Fetching ALL communities, Max attempts: ${maxAttempts}`);

    while (attempt <= maxAttempts && hasMoreData) {
      CommunitiesLogger.logAttemptStart(attempt, maxAttempts);

      const result = await CommunitiesProcessor.fetchAndProcessData();

      CommunitiesLogger.logAttemptResults(attempt, result);

      totalInserted += result.inserted || 0;
      totalUpdated += result.updated || 0;
      totalErrors += result.errors || 0;

      // Only continue if new records were inserted in this attempt
      hasMoreData = (result.inserted || 0) > 0;
      attempt++;
    }

    const finalCount = await this._getDatabaseCount();

    CommunitiesLogger.logFinalResults(
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
    };
  }

  /**
   * Returns the current count of community records in the database.
   * @returns {Promise<number>} - The total number of communities in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM communities");
    return result[0].total;
  }

  /**
   * Builds and logs the final result summary after the fetch loop.
   * @param {number} targetCount - The target number of communities.
   * @param {number} attemptsUsed - The number of attempts used.
   * @param {number} maxAttempts - The maximum allowed attempts.
   * @returns {object} - Summary of the fetch operation.
   */
  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this._getDatabaseCount();
    const status =
      finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;

    CommunitiesLogger.logFinalResults(
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
// Export the CommunitiesService class for use in controllers and routes
module.exports = CommunitiesService;
