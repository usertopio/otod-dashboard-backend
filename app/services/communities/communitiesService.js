// ===================== Imports =====================
import { connectionDB } from "../../config/db/db.conf.js";
import { COMMUNITIES_CONFIG, STATUS } from "../../utils/constants.js";
import CommunitiesProcessor from "./communitiesProcessor.js";
import CommunitiesLogger from "./communitiesLogger.js";

// ===================== Service =====================
export async function syncCommunitiesFromApi() {
  console.log("🔄 Starting communities sync from API...");
  const result = await CommunitiesProcessor.fetchAndProcessData();
  console.log(
    `✅ Communities sync complete. Inserted: ${result.inserted}, Updated: ${result.updated}, Errors: ${result.errors}, Total in DB: ${result.totalAfter}`
  );
  return result;
}

export default class CommunitiesService {
  /**
   * 1. Reset only the communities table in the database
   * 2. Fetch all communities from API and store in DB (loop with maxAttempts)
   * 3. Log attempt start/results and final results
   * 4. Return summary result object
   * 5. Get database count method
   */

  // 1. Reset only the communities table in the database
  static async resetOnlyCommunitiesTable() {
    const connection = connectionDB.promise();
    try {
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchCommunities`
      );
      console.log("==========================================\n");
      console.log("🧹 Resetting ONLY communities table...");
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE communities");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.log("✅ Only communities table reset - next ID will be 1");
      return { success: true, message: "Only communities table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting communities table:", error);
      throw error;
    }
  }

  // 2. Fetch all communities from API and store in DB (loop with maxAttempts)
  // 3. Log attempt start/results and final results
  // 4. Return summary result object
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
      table: "communities",
    };
  }

  // 5. Get database count method
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM communities");
    return result[0].total;
  }
}
