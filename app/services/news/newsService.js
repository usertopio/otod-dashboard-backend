const { connectionDB } = require("../../config/db/db.conf.js");
const { NEWS_CONFIG, STATUS } = require("../../utils/constants");
const NewsProcessor = require("./newsProcessor");
const NewsLogger = require("./newsLogger");

class NewsService {
  static async fetchNewsUntilTarget(
    targetCount = NEWS_CONFIG?.DEFAULT_TARGET_COUNT || 5, // 🔧 FIXED: Add fallback
    maxAttempts = NEWS_CONFIG?.DEFAULT_MAX_ATTEMPTS || 5 // 🔧 FIXED: Add fallback
  ) {
    NewsLogger.logTargetStart(targetCount, maxAttempts);

    let currentAttempt = 0;
    let currentCount = 0;
    let allResults = [];

    while (currentAttempt < maxAttempts) {
      currentAttempt++;

      // Check current database count
      currentCount = await this._getDatabaseCount();

      NewsLogger.logAttemptStart(
        currentAttempt,
        maxAttempts,
        currentCount,
        targetCount
      );

      // If we've reached the target, continue for fresh data (like farmers)
      if (currentCount >= targetCount) {
        console.log(
          `🔄 Target reached but continuing API call for fresh data...`
        );
      }

      // Process this attempt
      const result = await NewsProcessor.fetchAndProcessData();
      allResults.push(result);

      // Log attempt results
      NewsLogger.logAttemptResults(
        currentAttempt,
        result.inserted,
        result.updated,
        result.errors,
        result.totalAfter
      );

      // Log detailed metrics
      NewsLogger.logApiMetrics(result);
      NewsLogger.logDatabaseMetrics(result);
      NewsLogger.logAdditionalInsights(result);
      NewsLogger.logNewRecordIds(result);

      // Check if we reached target after this attempt
      if (result.totalAfter >= targetCount) {
        NewsLogger.logTargetReached(
          result.totalAfter,
          targetCount,
          currentAttempt
        );
        break;
      }
    }

    // Final count and results
    const finalCount = await this._getDatabaseCount();
    const finalResult = {
      message:
        finalCount >= targetCount
          ? "Fetch loop completed - SUCCESS"
          : "Fetch loop completed - INCOMPLETE",
      target: targetCount,
      achieved: finalCount,
      attemptsUsed: currentAttempt,
      maxAttempts: maxAttempts,
      status: finalCount >= targetCount ? "SUCCESS" : "INCOMPLETE",
      reachedTarget: finalCount >= targetCount,
    };

    NewsLogger.logFinalResults(finalResult);
    return finalResult;
  }

  // Get current database count
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
