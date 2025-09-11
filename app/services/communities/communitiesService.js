// ===================== Imports =====================
import { connectionDB } from "../../config/db/db.conf.js";
import { COMMUNITIES_CONFIG, STATUS } from "../../utils/constants.js";
import CommunitiesProcessor from "./communitiesProcessor.js";
import CommunitiesLogger from "./communitiesLogger.js";

// ===================== Service =====================
// CommunitiesService handles the business logic for fetching, resetting, and managing community records.
class CommunitiesService {
  /**
   * Resets only the communities table in the database.
   * - Disables foreign key checks to allow truncation.
   * - Truncates the communities table, leaving related tables untouched.
   * - Re-enables foreign key checks after operation.
   * - Logs the process and returns a status object.
   */
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

  /**
   * Fetches ALL communities from the API and stores them in the database.
   * Loops up to maxAttempts, stops early if no new records are inserted.
   * Returns a summary result object.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
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

    const finalCount = await this.getCount(); // ✅ Use service-level getCount()

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

  /**
   * Returns the current count of communities records in the database.
   * ✅ Pattern 1: Direct database operation in service layer
   */
  static async getCount() {
    try {
      const [result] = await connectionDB
        .promise()
        .query("SELECT COUNT(*) as total FROM communities");
      return result[0].total;
    } catch (error) {
      console.error("❌ Error getting communities count:", error);
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
   * @param {number} targetCount - The target number of communities.
   * @param {number} attemptsUsed - The number of attempts used.
   * @param {number} maxAttempts - The maximum allowed attempts.
   * @returns {object} - Summary of the fetch operation.
   */
  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this.getCount(); // ✅ Use service-level getCount()
    let status;

    // ✅ CONSISTENT: All handle "ALL" target correctly
    if (targetCount === "ALL") {
      status = finalCount > 0 ? STATUS.SUCCESS : STATUS.INCOMPLETE;
    } else {
      status = finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;
    }

    CommunitiesLogger.logFinalResults(
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
export default CommunitiesService;
