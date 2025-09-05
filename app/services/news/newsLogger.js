// services/news/newsLogger.js (ESM)

// ===================== Logger =====================
// NewsLogger provides structured logging for the news fetch/process workflow.
export default class NewsLogger {
  // EXACT MATCH to communities/farmers logging pattern
  static logTargetStart(targetCount, maxAttempts) {
    console.log(`🎯 Target: ${targetCount} news, Max attempts: ${maxAttempts}`);
    console.log("");
  }

  static logAttemptStart(attempt, maxAttempts) {
    console.log(`\n🔄 === ATTEMPT ${attempt}/${maxAttempts} ===`);
  }

  static logCurrentStatus(currentCount, targetCount) {
    console.log(`📊 Current news in DB: ${currentCount}/${targetCount}`);
  }

  static logTargetReachedButContinuing() {
    console.log(`🔄 Target reached but continuing API call for fresh data...`);
  }

  static logPageInfo(page, news) {
    console.log(`📄 Page ${page}: Length: ${news.length}`);
  }

  static logApiSummary(totalFromAPI, uniqueFromAPI) {
    console.log(`📊 Total from API: ${totalFromAPI}, Unique: ${uniqueFromAPI}`);
  }

  static logAttemptResults(attempt, result) {
    console.log(`📈 Attempt ${attempt} completed:`);
    console.log(`   ➕ Inserted: ${result.inserted}`);
    console.log(`   🔄 Updated: ${result.updated}`);
    console.log(`   ❌ Errors: ${result.errors}`);
    console.log(`   📊 Total now: ${result.totalAfter}`);

    if (result.recordsInDbNotInAPI > 0) {
      console.log(
        `📍 Records in DB but not in current API: ${result.recordsInDbNotInAPI}`
      );
    }

    console.log("==========================================\n");
  }

  static logTargetReached(targetCount, attemptsUsed) {
    console.log(
      `🎯 Target of ${targetCount} reached after ${attemptsUsed} attempts ✅`
    );
  }

  static logFinalResults(
    targetCount,
    finalCount,
    attemptsUsed,
    maxAttempts,
    status
  ) {
    console.log(``);
    console.log(`🏁 === FINAL RESULT ===`);
    console.log(`🎯 Target: ${targetCount}`);
    console.log(`📊 Achieved: ${finalCount}`);
    console.log(`🔄 Attempts used: ${attemptsUsed}/${maxAttempts}`);
    console.log(`✅ Status: ${status}`);
  }
}
