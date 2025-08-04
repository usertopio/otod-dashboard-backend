const GapProcessor = require("./gapProcessor");
const GapLogger = require("./gapLogger");
const { GAP_CONFIG } = require("../../utils/constants");

class GapService {
  static async fetchGapUntilTarget(targetCount, maxAttempts) {
    const processor = new GapProcessor();

    GapLogger.logTargetStart(targetCount, maxAttempts);

    let currentAttempt = 1;
    let result = null;

    while (currentAttempt <= maxAttempts) {
      const currentCount = await processor.getCurrentCount();

      GapLogger.logAttemptStart(
        currentAttempt,
        maxAttempts,
        currentCount,
        targetCount
      );

      if (currentCount >= targetCount && currentAttempt > 1) {
        GapLogger.logTargetReachedButContinuing();
      }

      result = await processor.fetchAndProcessData(currentAttempt);

      GapLogger.logAttemptResults(
        currentAttempt,
        result.inserted,
        result.updated,
        result.errors,
        result.totalAfter
      );

      if (result.totalAfter >= targetCount) {
        console.log(
          `🎯 Target of ${targetCount} reached after ${currentAttempt} attempts ✅`
        );
        break;
      }

      currentAttempt++;
    }

    if (result && result.totalAfter < targetCount) {
      console.log(
        `⚠️ Target not reached after ${maxAttempts} attempts. Current: ${result.totalAfter}/${targetCount}`
      );
    }

    if (result) {
      GapLogger.logApiMetrics(result);
      GapLogger.logDatabaseMetrics(result);
      GapLogger.logAdditionalInsights(result);
    }

    return (
      result || {
        totalBefore: 0,
        totalAfter: 0,
        totalFromAPI: 0,
        uniqueFromAPI: 0,
        inserted: 0,
        updated: 0,
        errors: 0,
        duplicatedDataAmount: 0,
        attempts: currentAttempt - 1,
      }
    );
  }
}

module.exports = GapService;
