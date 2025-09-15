// ===================== Imports =====================
import { connectionDB } from "../../config/db/db.conf.js";
import { NEWS_CONFIG, STATUS } from "../../utils/constants.js";
import NewsProcessor from "./newsProcessor.js";
import NewsLogger from "./newsLogger.js";

// ===================== Service =====================
// NewsService handles the business logic for fetching, resetting, and managing news records.
export default class NewsService {
  /**
   * Resets only the news table in the database.
   * - Disables foreign key checks to allow truncation.
   * - Truncates the news table, leaving related tables untouched.
   * - Re-enables foreign key checks after operation.
   * - Logs the process and returns a status object.
   */
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

  /**
   * Fetches ALL news from the API and stores them in the database.
   * Loops up to maxAttempts, stops early if no new records are inserted.
   * Returns a summary result object.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
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

      // ✅ ADD: Early termination for efficiency
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

  /**
   * Returns the current count of news records in the database.
   * @returns {Promise<number>} - The total number of news in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM news");
    return result[0].total;
  }

  /**
   * Builds and logs the final result summary after the fetch loop.
   * @param {number} targetCount - The target number of news.
   * @param {number} attemptsUsed - The number of attempts used.
   * @param {number} maxAttempts - The maximum allowed attempts.
   * @returns {object} - Summary of the fetch operation.
   */
  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this._getDatabaseCount();
    let status;

    // All handle "ALL" target correctly
    if (targetCount === "ALL") {
      status = finalCount > 0 ? STATUS.SUCCESS : STATUS.INCOMPLETE;
    } else {
      status = finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;
    }

    NewsLogger.logFinalResults(
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
