// ===================== Imports =====================
import { connectionDB } from "../../config/db/db.conf.js";
import { FARMERS_CONFIG, STATUS } from "../../utils/constants.js";
import FarmersProcessor from "./farmersProcessor.js";
import FarmersLogger from "./farmersLogger.js";

// ===================== Service =====================
export async function syncFarmersFromApi() {
  console.log("🔄 Starting farmer sync from API...");
  const result = await FarmersProcessor.fetchAndProcessData();
  console.log(
    `✅ Farmer sync complete. Inserted: ${result.inserted}, Updated: ${result.updated}, Errors: ${result.errors}, Total in DB: ${result.totalAfter}`
  );
  return result;
}

export default class FarmersService {
  /**
   * 1. Reset only the farmers table in the database
   * 2. Fetch all farmers from API and store in DB (loop with maxAttempts)
   * 3. Log attempt start/results and final results
   * 4. Return summary result object
   * 5. Get database count method
   */

  // 1. Reset only the farmers table in the database
  static async resetOnlyFarmersTable() {
    const connection = connectionDB.promise();
    try {
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchFarmers`
      );
      console.log("==========================================\n");
      console.log("🧹 Resetting ONLY farmers table...");
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("DELETE FROM farmers");
      await connection.query("ALTER TABLE farmers AUTO_INCREMENT = 1");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.log("✅ Only farmers table reset - next ID will be 1");
      return { success: true, message: "Only farmers table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting farmers table:", error);
      throw error;
    }
  }

  // 2. Fetch all farmers from API and store in DB (loop with maxAttempts)
  // 3. Log attempt start/results and final results
  // 4. Return summary result object
  static async fetchAllFarmers(
    maxAttempts = FARMERS_CONFIG.DEFAULT_MAX_ATTEMPTS
  ) {
    await this.resetOnlyFarmersTable();

    let attempt = 1;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let hasMoreData = true;

    console.log(`👨‍🌾 Fetching ALL farmers, Max attempts: ${maxAttempts}`);

    while (attempt <= maxAttempts && hasMoreData) {
      FarmersLogger.logAttemptStart(attempt, maxAttempts);

      const result = await FarmersProcessor.fetchAndProcessData();

      FarmersLogger.logAttemptResults(attempt, result);

      totalInserted += result.inserted || 0;
      totalUpdated += result.updated || 0;
      totalErrors += result.errors || 0;

      const hasNewData = (result.inserted || 0) > 0;
      hasMoreData = hasNewData;

      console.log(
        `🔍 Attempt ${attempt}: New data: ${hasNewData}, Continue: ${hasMoreData}`
      );

      attempt++;
    }

    const finalCount = await this._getDatabaseCount();

    FarmersLogger.logFinalResults(
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
      table: "farmers",
    };
  }

  // 5. Get database count method
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM farmers");
    return result[0].total;
  }
}
