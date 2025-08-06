const { connectionDB } = require("../../config/db/db.conf.js");
const { NEWS_CONFIG, STATUS } = require("../../utils/constants");
const NewsProcessor = require("./newsProcessor");
const NewsLogger = require("./newsLogger");

class NewsService {
  // 🔧 ADD: Reset only news table
  static async resetOnlyNewsTable() {
    const connection = connectionDB.promise();

    try {
      console.log("🧹 Resetting ONLY news table...");

      // Disable foreign key checks
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");

      // Delete only news
      await connection.query("TRUNCATE TABLE news");

      // Re-enable foreign key checks
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("✅ Only news table reset - next ID will be 1");
      return { success: true, message: "Only news table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting news table:", error);
      throw error;
    }
  }

  static async fetchNewsUntilTarget(targetCount, maxAttempts) {
    // 🔧 ADD: Reset news table before fetching
    await this.resetOnlyNewsTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    console.log(`🎯 Target: ${targetCount} news, Max attempts: ${maxAttempts}`);

    // Main processing loop
    while (attempt <= maxAttempts) {
      NewsLogger.logAttemptStart(attempt, maxAttempts);

      // Get current count before this attempt
      currentCount = await this._getDatabaseCount();
      NewsLogger.logCurrentStatus(currentCount, targetCount);

      // Always make API call
      attemptsUsed++;
      const result = await NewsProcessor.fetchAndProcessData();

      // Log detailed metrics for this attempt
      NewsLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

      // Stop when target is reached
      if (currentCount >= targetCount) {
        NewsLogger.logTargetReached(targetCount, attemptsUsed);
        break;
      }
    }

    return this._buildFinalResult(targetCount, attemptsUsed, maxAttempts);
  }

  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM news");
    return result[0].total;
  }

  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this._getDatabaseCount();
    const status =
      finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;

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

module.exports = NewsService;
