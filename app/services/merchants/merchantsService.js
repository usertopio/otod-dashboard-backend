const MerchantsProcessor = require("./merchantsProcessor");
const MerchantsLogger = require("./merchantsLogger");
const { MERCHANTS_CONFIG } = require("../../utils/constants");

class MerchantsService {
  static async fetchMerchantsUntilTarget(targetCount, maxAttempts) {
    const processor = new MerchantsProcessor();

    MerchantsLogger.logTargetStart(targetCount, maxAttempts);

    let currentAttempt = 1;
    let result = null;

    while (currentAttempt <= maxAttempts) {
      const currentCount = await processor.getCurrentCount();

      MerchantsLogger.logAttemptStart(
        currentAttempt,
        maxAttempts,
        currentCount,
        targetCount
      );

      if (currentCount >= targetCount && currentAttempt > 1) {
        MerchantsLogger.logTargetReachedButContinuing();
      }

      result = await processor.fetchAndProcessData(currentAttempt);

      MerchantsLogger.logAttemptResults(
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
      MerchantsLogger.logApiMetrics(result);
      MerchantsLogger.logDatabaseMetrics(result);
      MerchantsLogger.logAdditionalInsights(result);
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

module.exports = MerchantsService;
