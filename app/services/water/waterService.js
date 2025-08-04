const WaterProcessor = require("./waterProcessor");
const WaterLogger = require("./waterLogger");
const { WATER_CONFIG } = require("../../utils/constants");

class WaterService {
  static async fetchWater(targetCount, maxAttempts) {
    const processor = new WaterProcessor();

    WaterLogger.logTargetStart(targetCount, maxAttempts);

    let currentAttempt = 1;
    let result = null;

    while (currentAttempt <= maxAttempts) {
      const currentCount = await processor.getCurrentCount();

      WaterLogger.logAttemptStart(
        currentAttempt,
        maxAttempts,
        currentCount,
        targetCount
      );

      if (currentCount >= targetCount && currentAttempt > 1) {
        WaterLogger.logTargetReachedButContinuing();
      }

      result = await processor.fetchAndProcessData(currentAttempt);

      WaterLogger.logAttemptResults(
        currentAttempt,
        result.inserted,
        result.updated,
        result.errors,
        result.totalAfter
      );

      // Since no pagination and no target, we complete after first attempt
      console.log(
        `✅ Water data fetch completed after ${currentAttempt} attempt(s)`
      );
      break;
    }

    if (result) {
      WaterLogger.logApiMetrics(result);
      WaterLogger.logDatabaseMetrics(result);
      WaterLogger.logAdditionalInsights(result);
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
        attempts: currentAttempt,
      }
    );
  }
}

module.exports = WaterService;
