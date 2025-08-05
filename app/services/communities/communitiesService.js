const { connectionDB } = require("../../config/db/db.conf.js");
const { COMMUNITIES_CONFIG, STATUS } = require("../../utils/constants");
const CommunitiesProcessor = require("./communitiesProcessor");
const CommunitiesLogger = require("./communitiesLogger");

class CommunitiesService {
  static async fetchCommunitiesUntilTarget(
    targetCount = COMMUNITIES_CONFIG.DEFAULT_TARGET_COUNT,
    maxAttempts = COMMUNITIES_CONFIG.DEFAULT_MAX_ATTEMPTS
  ) {
    CommunitiesLogger.logTargetStart(targetCount, maxAttempts);

    let currentAttempt = 0;
    let currentCount = 0;
    let allResults = [];

    while (currentAttempt < maxAttempts) {
      currentAttempt++;

      // Check current database count
      currentCount = await this._getDatabaseCount();

      CommunitiesLogger.logAttemptStart(
        currentAttempt,
        maxAttempts,
        currentCount,
        targetCount
      );

      // Process this attempt
      const result = await CommunitiesProcessor.fetchAndProcessData();
      allResults.push(result);

      CommunitiesLogger.logAttemptResults(
        currentAttempt,
        result.inserted,
        result.updated,
        result.errors,
        result.totalAfter
      );

      CommunitiesLogger.logApiMetrics(result);
      CommunitiesLogger.logDatabaseMetrics(result);
      CommunitiesLogger.logAdditionalInsights(result);
      CommunitiesLogger.logNewRecordIds(result);

      // Check if we reached target after this attempt
      if (result.totalAfter >= targetCount) {
        CommunitiesLogger.logTargetReached(
          result.totalAfter,
          targetCount,
          currentAttempt
        );
        break;
      }
    }

    // Final count and results
    const finalCount = await this._getDatabaseCount();

    // 🔧 FIXED: Build result in exact farmers format
    const finalResult = {
      // 🔧 EXACT MATCH: Same fields as farmers response
      message:
        finalCount >= targetCount
          ? "Fetch loop completed - SUCCESS"
          : "Fetch loop completed - INCOMPLETE",
      target: targetCount,
      achieved: finalCount,
      attemptsUsed: currentAttempt,
      maxAttempts: maxAttempts,
      status: finalCount >= targetCount ? "SUCCESS" : "INCOMPLETE",
      reachedTarget: finalCount >= targetCount, // 🔧 ADD: This field from farmers
    };

    CommunitiesLogger.logFinalResults(finalResult);
    return finalResult;
  }

  // 🔧 SAME AS FARMERS: Get current database count
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM communities");
    return result[0].total;
  }

  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this._getDatabaseCount();
    const status =
      finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;

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

module.exports = CommunitiesService;
