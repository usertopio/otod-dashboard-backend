const { connectionDB } = require("../../config/db/db.conf.js");
const { NEWS_CONFIG, STATUS } = require("../../utils/constants");
const NewsProcessor = require("./newsProcessor");
const NewsLogger = require("./newsLogger");

class NewsService {
  static async fetchNewsUntilTarget(targetCount, maxAttempts) {
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

      // 🔧 FIX: Should be logAttemptResults, NOT logApiMetrics
      NewsLogger.logAttemptResults(attempt, result); // ✅ Correct method

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
