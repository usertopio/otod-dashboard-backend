// ===================== Imports =====================
import { connectionDB } from "../../config/db/db.conf.js";
import { CROPS_CONFIG, STATUS } from "../../utils/constants.js";
import CropsProcessor from "./cropsProcessor.js";
import CropsLogger from "./cropsLogger.js";

// ===================== Service =====================
// CropsService handles the business logic for fetching, resetting, and managing crop records.
class CropsService {
  /**
   * Resets only the crops table in the database.
   * - Disables foreign key checks to allow truncation.
   * - Truncates the crops table, leaving related tables untouched.
   * - Re-enables foreign key checks after operation.
   * - Logs the process and returns a status object.
   */
  static async resetOnlyCropsTable() {
    const connection = connectionDB.promise();

    try {
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchCrops`
      );
      console.log("==========================================\n");

      console.log("🧹 Resetting ONLY crops table...");

      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE crops");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("✅ Only crops table reset - next ID will be 1");
      return { success: true, message: "Only crops table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting crops table:", error);
      throw error;
    }
  }

  /**
   * Fetches ALL crops from APIs and stores them in the database.
   * Loops up to maxAttempts, stops early if no new records are inserted.
   * Returns a summary result object.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
  static async fetchAllCrops(maxAttempts = CROPS_CONFIG.DEFAULT_MAX_ATTEMPTS) {
    await this.resetOnlyCropsTable();

    let attempt = 1;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let hasMoreData = true;

    console.log(`🌾 Fetching ALL crops, Max attempts: ${maxAttempts}`);

    while (attempt <= maxAttempts && hasMoreData) {
      CropsLogger.logAttemptStart(attempt, maxAttempts);

      const result = await CropsProcessor.fetchAndProcessData();

      CropsLogger.logAttemptResults(attempt, result);

      totalInserted += result.inserted || 0;
      totalUpdated += result.updated || 0;
      totalErrors += result.errors || 0;

      const hasNewData = (result.inserted || 0) > 0;
      hasMoreData = hasNewData;

      console.log(
        `🔍 Attempt ${attempt}: Inserted ${result.inserted}, Continue: ${hasMoreData}`
      );

      attempt++;
    }

    return this._buildFinalResult("ALL", attempt - 1, maxAttempts);
  }

  /**
   * Returns the current count of crops records in the database.
   * ✅ Pattern 1: Direct database operation in service layer
   */
  static async getCount() {
    try {
      const [result] = await connectionDB
        .promise()
        .query("SELECT COUNT(*) as total FROM crops");
      return result[0].total;
    } catch (error) {
      console.error("❌ Error getting crops count:", error);
      return 0;
    }
  }

  /**
   * ✅ Pattern 1: Direct database operation in service layer (for consistency)
   * @private
   */
  static async _getDatabaseCount() {
    return await this.getCount();
  }

  /**
   * Builds and logs the final result summary after the fetch loop.
   * @param {number} targetCount - The target number of crops.
   * @param {number} attemptsUsed - The number of attempts used.
   * @param {number} maxAttempts - The maximum allowed attempts.
   * @returns {object} - Summary of the fetch operation.
   */
  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this.getCount(); // ✅ Use service-level getCount()
    const status =
      finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;

    CropsLogger.logFinalResults(
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
export default CropsService;
