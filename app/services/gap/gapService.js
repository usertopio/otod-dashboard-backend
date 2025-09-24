// ===================== Imports =====================
import { connectionDB } from "../../config/db/db.conf.js";
import { GAP_CONFIG, STATUS } from "../../utils/constants.js";
import GapProcessor from "./gapProcessor.js";
import GapLogger from "./gapLogger.js";

// ===================== Service =====================
// GapService handles the business logic for fetching, resetting, and managing GAP certificate records.
export default class GapService {
  /**
   * 1. Reset only the gap table in the database
   * 2. Fetch all GAP certificates from API and store in DB (loop with maxAttempts)
   * 3. Log attempt start/results and final results
   * 4. Return summary result object
   * 5. Get database count method
   */

  // 1. Reset only the gap table in the database
  static async resetOnlyGapTable() {
    const connection = connectionDB.promise();
    try {
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchGap`
      );
      console.log("==========================================\n");
      console.log("🧹 Resetting ONLY gap table...");
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE gap");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.log("✅ Only gap table reset - next ID will be 1");
      return { success: true, message: "Only gap table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting gap table:", error);
      throw error;
    }
  }

  // 2. Fetch all GAP certificates from API and store in DB (loop with maxAttempts)
  // 3. Log attempt start/results and final results
  // 4. Return summary result object
  static async fetchAllGap(maxAttempts = GAP_CONFIG.DEFAULT_MAX_ATTEMPTS) {
    await this.resetOnlyGapTable();

    let attempt = 1;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let hasMoreData = true;

    console.log(
      `📜 Fetching ALL GAP certificates, Max attempts: ${maxAttempts}`
    );

    while (attempt <= maxAttempts && hasMoreData) {
      GapLogger.logAttemptStart(attempt, maxAttempts);

      const result = await GapProcessor.fetchAndProcessData();

      GapLogger.logAttemptResults(attempt, result);

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

    GapLogger.logFinalResults(
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
      table: "gap",
    };
  }

  // 5. Get database count method
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM gap");
    return result[0].total;
  }
}
