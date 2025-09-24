// ===================== Imports =====================
import { connectionDB } from "../../config/db/db.conf.js";
import { DURIAN_GARDENS_CONFIG, STATUS } from "../../utils/constants.js";
import DurianGardensProcessor from "./durianGardensProcessor.js";
import DurianGardensLogger from "./durianGardensLogger.js";

// ===================== Service =====================

/**
 * Syncs durian gardens data from the API to the database.
 * Logs the start and completion of the sync process.
 * @returns {Promise<object>} - The result of the sync operation.
 */
export async function syncDurianGardensFromApi() {
  console.log("🔄 Starting durian gardens sync from API...");
  const result = await DurianGardensProcessor.fetchAndProcessData();
  console.log(
    `✅ Durian gardens sync complete. Inserted: ${result.inserted}, Updated: ${result.updated}, Errors: ${result.errors}, Total in DB: ${result.totalAfter}`
  );
  return result;
}

// DurianGardensService handles the business logic for fetching, resetting, and managing durian garden records.
export default class DurianGardensService {
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
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchDurianGardens`
      );
      console.log("==========================================\n");

      console.log("🧹 Resetting ONLY durian_gardens table...");

      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE durian_gardens");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("✅ Only durian_gardens table reset - next ID will be 1");
      return { success: true, message: "Only durian_gardens table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting durian_gardens table:", error);
      throw error;
    }
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

      const hasNewData = (result.inserted || 0) > 0;
      hasMoreData = hasNewData;

      console.log(
        `🔍 Attempt ${attempt}: Inserted ${result.inserted}, Continue: ${hasMoreData}`
      );

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
}
