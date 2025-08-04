const SubstanceProcessor = require("./substanceProcessor");
const SubstanceLogger = require("./substanceLogger");
const { SUBSTANCE_CONFIG } = require("../../utils/constants");

class SubstanceService {
  static async fetchSubstance(targetCount, maxAttempts) {
    const processor = new SubstanceProcessor();

    SubstanceLogger.logTargetStart(targetCount, maxAttempts);

    let currentAttempt = 1;
    let result = null;

    while (currentAttempt <= maxAttempts) {
      const currentCount = await processor.getCurrentCount();

      SubstanceLogger.logAttemptStart(
        currentAttempt,
        maxAttempts,
        currentCount,
        targetCount
      );

      if (currentCount >= targetCount && currentAttempt > 1) {
        SubstanceLogger.logTargetReachedButContinuing();
      }

      result = await processor.fetchAndProcessData(currentAttempt);

      SubstanceLogger.logAttemptResults(
        currentAttempt,
        result.inserted,
        result.updated,
        result.errors,
        result.totalAfter
      );

      // Since no pagination and no target, we complete after first attempt
      console.log(
        `✅ Substance data fetch completed after ${currentAttempt} attempt(s)`
      );
      break;
    }

    if (result) {
      SubstanceLogger.logApiMetrics(result);
      SubstanceLogger.logDatabaseMetrics(result);
      SubstanceLogger.logAdditionalInsights(result);
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

module.exports = SubstanceService;
