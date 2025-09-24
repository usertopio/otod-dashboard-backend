// ===================== Imports =====================
import { connectionDB } from "../../config/db/db.conf.js";
import { NEWS_CONFIG, STATUS } from "../../utils/constants.js";
import NewsProcessor from "./newsProcessor.js";
import NewsLogger from "./newsLogger.js";

// ===================== Service =====================
// NewsService handles the business logic for fetching, resetting, and managing news records.
export default class NewsService {
  /**
   * 1. Reset only the news table in the database
   * 2. Fetch all news from API and store in DB (loop with maxAttempts)
   * 3. Log attempt start/results and final results
   * 4. Return summary result object
   * 5. Get database count method
   */

  // 1. Reset only the news table in the database
  static async resetOnlyNewsTable() {
    const connection = connectionDB.promise();
    try {
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchNews`
      );
      console.log("==========================================\n");
      console.log("🧹 Resetting ONLY news table...");
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE news");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.log("✅ Only news table reset - next ID will be 1");
      return { success: true, message: "Only news table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting news table:", error);
      throw error;
    }
  }

  // 2. Fetch all news from API and store in DB (loop with maxAttempts)
  // 3. Log attempt start/results and final results
  // 4. Return summary result object
  static async fetchAllNews(maxAttempts = NEWS_CONFIG.DEFAULT_MAX_ATTEMPTS) {
    await this.resetOnlyNewsTable();

    let attempt = 1;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let hasMoreData = true;

    console.log(`📰 Fetching ALL news, Max attempts: ${maxAttempts}`);

    while (attempt <= maxAttempts && hasMoreData) {
      NewsLogger.logAttemptStart(attempt, maxAttempts);

      const result = await NewsProcessor.fetchAndProcessData();

      NewsLogger.logAttemptResults(attempt, result);

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

    NewsLogger.logFinalResults(
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
      table: "news",
    };
  }

  // 5. Get database count method
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM news");
    return result[0].total;
  }
}
