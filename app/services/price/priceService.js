// ===================== Imports =====================
import { connectionDB } from "../../config/db/db.conf.js";
import AvgPriceProcessor from "./priceProcessor.js";
import AvgPriceLogger from "./priceLogger.js";

// ===================== Service =====================
// AvgPriceService handles the business logic for fetching, resetting, and managing avg price records.
export default class AvgPriceService {
  /**
   * Resets only the avg_price table in the database.
   * - Disables foreign key checks to allow truncation.
   * - Truncates the avg_price table, leaving related tables untouched.
   * - Re-enables foreign key checks after operation.
   * - Logs the process and returns a status object.
   */
  static async resetOnlyPriceTable() {
    const connection = connectionDB.promise();
    try {
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchAvgPrice`
      );
      console.log("==========================================\n");

      console.log("🧹 Resetting ONLY avg_price table...");

      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE avg_price"); // CHANGED
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.log("✅ Only avg_price table reset - next ID will be 1");
      return { success: true, message: "Only avg_price table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting avg_price table:", error);
      throw error;
    }
  }

  /**
   * Fetches ALL avg price records from the API and stores them in the database.
   * Loops up to maxAttempts, stops early if API returns no new data.
   * Returns a summary result object.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
  static async fetchAllAvgPrices(maxAttempts = 10) {
    await this.resetOnlyPriceTable();

    let attempt = 1;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let hasMoreData = true;

    console.log(
      `💰 Fetching ALL avg price records, Max attempts: ${maxAttempts}`
    );

    while (attempt <= maxAttempts && hasMoreData) {
      AvgPriceLogger.logAttemptStart(attempt, maxAttempts);

      // Fetch and process data (single bulk operation)
      const result = await AvgPriceProcessor.fetchAndProcessData();
      AvgPriceLogger.logAttemptResults(attempt, result); // Pass the whole result object

      totalInserted += result.dbResult?.inserted || 0;
      totalUpdated += result.dbResult?.updated || 0;
      totalErrors += result.dbResult?.errors || 0;

      // Stop if no new records were inserted
      hasMoreData = (result.dbResult?.inserted || 0) > 0;

      console.log(
        `🔍 Attempt ${attempt}: Inserted ${
          result.dbResult?.inserted || 0
        }, Continue: ${hasMoreData}`
      );

      if (!hasMoreData) break;
      attempt++;
    }

    const finalCount = await this._getDatabaseCount();

    AvgPriceLogger.logFinalResults(
      "ALL",
      finalCount,
      attempt,
      maxAttempts,
      "SUCCESS"
    );

    return {
      message: `Fetch loop completed - ALL records fetched`,
      achieved: finalCount,
      attemptsUsed: attempt,
      maxAttempts: maxAttempts,
      inserted: totalInserted,
      updated: totalUpdated,
      errors: totalErrors,
      status: "SUCCESS",
      reachedTarget: true,
      table: "avg_price", // CHANGED
    };
  }

  /**
   * Returns the current count of avg price records in the database.
   * @returns {Promise<number>} - The total number of avg price records in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM avg_price"); // CHANGED
    return result[0].total;
  }
}
