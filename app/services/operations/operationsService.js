// ===================== Imports =====================
import { connectionDB } from "../../config/db/db.conf.js";
import { OPERATIONS_CONFIG, STATUS } from "../../utils/constants.js";
import OperationsProcessor from "./operationsProcessor.js";
import OperationsLogger from "./operationsLogger.js";

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
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchOperations`
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
   * Main entry point for fetching operations from the API and storing them in the database.
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
   * Fetches ALL operations from the API and stores them in the database.
   * Loops up to maxAttempts, stops early if no new records are inserted.
   * Returns a summary result object.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
  static async fetchAllOperations(
    maxAttempts = OPERATIONS_CONFIG.DEFAULT_MAX_ATTEMPTS
  ) {
    await this.resetOnlyOperationsTable();

    let attempt = 1;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let hasMoreData = true;

    console.log(`⚙️ Fetching ALL operations, Max attempts: ${maxAttempts}`);

    while (attempt <= maxAttempts && hasMoreData) {
      OperationsLogger.logAttemptStart(attempt, maxAttempts);

      const result = await OperationsProcessor.fetchAndProcessData();

      OperationsLogger.logAttemptResults(attempt, result);

      totalInserted += result.inserted || 0;
      totalUpdated += result.updated || 0;
      totalErrors += result.errors || 0;

      // Only continue if new records were inserted in this attempt
      hasMoreData = (result.inserted || 0) > 0;
      attempt++;
    }

    const finalCount = await this._getDatabaseCount();

    OperationsLogger.logFinalResults(
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
      table: "operations",
    };
  }

  /**
   * Returns the current count of operations records in the database.
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
export default OperationsService;
