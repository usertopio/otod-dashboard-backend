// ===================== Imports =====================
import { connectionDB } from "../../config/db/db.conf.js";
import { SUBSTANCE_CONFIG, STATUS } from "../../utils/constants.js";
import SubstanceProcessor from "./substanceProcessor.js";
import SubstanceLogger from "./substanceLogger.js";

// ===================== Service =====================
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
   * Main entry point for fetching substance from the API and storing it in the database.
   * - Resets the substance table before starting.
   * - Loops up to maxAttempts, fetching and processing data each time.
   * - Logs progress and metrics for each attempt.
   * - Stops early if the target number of records is reached.
   * - Returns a summary result object.
   * @param {number} targetCount - The number of substance records to fetch and store.
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
   * Fetches ALL substance from the API and stores it in the database.
   * Loops up to maxAttempts, stops early if no new records are inserted.
   * Returns a summary result object.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
  static async fetchAllSubstance(
    maxAttempts = SUBSTANCE_CONFIG.DEFAULT_MAX_ATTEMPTS
  ) {
    await this.resetOnlySubstanceTable();

    let attempt = 1;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let hasMoreData = true;

    console.log(`🧪 Fetching ALL substance, Max attempts: ${maxAttempts}`);

    while (attempt <= maxAttempts && hasMoreData) {
      SubstanceLogger.logAttemptStart(attempt, maxAttempts);

      const result = await SubstanceProcessor.fetchAndProcessData();

      SubstanceLogger.logAttemptResults(attempt, result);

      totalInserted += result.inserted || 0;
      totalUpdated += result.updated || 0;
      totalErrors += result.errors || 0;

      // Only continue if new records were inserted in this attempt
      hasMoreData = (result.inserted || 0) > 0;
      attempt++;
    }

    const finalCount = await this._getDatabaseCount();

    SubstanceLogger.logFinalResults(
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
      table: "substance",
    };
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
export default SubstanceService;
