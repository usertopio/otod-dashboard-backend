// ===================== Imports =====================
// Import DB connection for executing SQL queries
const { connectionDB } = require("../../config/db/db.conf.js");
const { OPERATIONS_CONFIG, STATUS } = require("../../utils/constants");
const OperationsProcessor = require("./operationsProcessor");
const OperationsLogger = require("./operationsLogger");

// ===================== Service =====================
// OperationsService handles the business logic for fetching, resetting, and managing operation records.
class OperationsService {
  /**
   * Resets only the operations table in the database.
   * - Disables foreign key checks to allow truncation.
   * - Truncates the operations table, leaving related tables untouched.
   * - Re-enables foreign key checks after operation.
   * - Logs the process and returns a status object.
   */
  static async resetOnlyOperationsTable() {
    const connection = connectionDB.promise();

    try {
      console.log("==========================================");
      console.log(
        `🔄  Calling API Endpoint: {{LOCAL_HOST}}/api/fetchOperations`
      );
      console.log("==========================================\n");

      console.log("🧹 Resetting ONLY operations table...");

      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE operations");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("✅ Only operations table reset - next ID will be 1");
      return { success: true, message: "Only operations table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting operations table:", error);
      throw error;
    }
  }

  /**
   * Main entry point for fetching operations from APIs and storing them in the database.
   * - Resets the operations table before starting.
   * - Loops up to maxAttempts, fetching and processing data each time.
   * - Logs progress and metrics for each attempt.
   * - Stops early if the target number of operations is reached.
   * - Returns a summary result object.
   * @param {number} targetCount - The number of operations to fetch and store.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
  static async fetchOperations(targetCount, maxAttempts) {
    await this.resetOnlyOperationsTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    console.log(
      `🎯 Target: ${targetCount} operations, Max attempts: ${maxAttempts}`
    );

    while (attempt <= maxAttempts) {
      OperationsLogger.logAttemptStart(attempt, maxAttempts);

      currentCount = await this._getDatabaseCount();
      OperationsLogger.logCurrentStatus(currentCount, targetCount);

      attemptsUsed++;
      const result = await OperationsProcessor.fetchAndProcessData();

      OperationsLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

      if (currentCount >= targetCount) {
        OperationsLogger.logTargetReached(targetCount, attemptsUsed);
        break;
      }
    }

    return this._buildFinalResult(targetCount, attemptsUsed, maxAttempts);
  }

  /**
   * Returns the current count of operation records in the database.
   * @returns {Promise<number>} - The total number of operations in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM operations");
    return result[0].total;
  }

  /**
   * Builds and logs the final result summary after the fetch loop.
   * @param {number} targetCount - The target number of operations.
   * @param {number} attemptsUsed - The number of attempts used.
   * @param {number} maxAttempts - The maximum allowed attempts.
   * @returns {object} - Summary of the fetch operation.
   */
  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this._getDatabaseCount();
    const status =
      finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;

    OperationsLogger.logFinalResults(
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
module.exports = OperationsService;
