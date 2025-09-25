// ===================== Imports =====================
import { connectionDB } from "../../config/db/db.conf.js";
import { MERCHANTS_CONFIG, STATUS } from "../../utils/constants.js";
import MerchantsProcessor from "./merchantsProcessor.js";
import MerchantsLogger from "./merchantsLogger.js";

// ===================== Service =====================
// MerchantsService handles the business logic for fetching, resetting, and managing merchant records.
export default class MerchantsService {
  /**
   * 1. Reset only the merchants table in the database
   * 2. Fetch all merchants from API and store in DB (loop with maxAttempts)
   * 3. Log attempt start/results and final results
   * 4. Return summary result object
   * 5. Get database count method
   */

  // 1. Reset only the merchants table in the database
  static async resetOnlyMerchantsTable() {
    const connection = connectionDB.promise();
    try {
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchMerchants`
      );
      console.log("==========================================\n");
      console.log("🧹 Resetting ONLY merchants table...");
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE merchants");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.log("✅ Only merchants table reset - next ID will be 1");
      return { success: true, message: "Only merchants table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting merchants table:", error);
      throw error;
    }
  }

  // 2. Fetch all merchants from API and store in DB (loop with maxAttempts)
  // 3. Log attempt start/results and final results
  // 4. Return summary result object
  static async fetchAllMerchants(
    maxAttempts = MERCHANTS_CONFIG.DEFAULT_MAX_ATTEMPTS
  ) {
    await this.resetOnlyMerchantsTable();

    let attempt = 1;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let hasMoreData = true;

    console.log(`🏪 Fetching ALL merchants, Max attempts: ${maxAttempts}`);

    while (attempt <= maxAttempts && hasMoreData) {
      MerchantsLogger.logAttemptStart(attempt, maxAttempts);

      const result = await MerchantsProcessor.fetchAndProcessData();

      MerchantsLogger.logAttemptResults(attempt, result);

      totalInserted += result.inserted || 0;
      totalUpdated += result.updated || 0;
      totalErrors += result.errors || 0;

      hasMoreData = (result.inserted || 0) > 0;

      // Early termination for efficiency
      if (
        attempt === 1 &&
        (result.inserted || 0) > 0 &&
        (result.errors || 0) === 0
      ) {
        console.log(
          `✅ First attempt successful with ${result.inserted} records - stopping`
        );
        hasMoreData = false;
      }

      console.log(
        `🔍 Attempt ${attempt}: Inserted ${result.inserted}, Continue: ${hasMoreData}`
      );

      attempt++;
    }

    const finalCount = await this._getDatabaseCount();

    MerchantsLogger.logFinalResults(
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
      table: "merchants",
    };
  }

  // 5. Get database count method
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM merchants");
    return result[0].total;
  }
}
