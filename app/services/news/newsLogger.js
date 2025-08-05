class NewsLogger {
  // EXACT MATCH to communities/farmers logging pattern
  static logTargetStart(targetCount, maxAttempts) {
    console.log(`🎯 Target: ${targetCount} news, Max attempts: ${maxAttempts}`);
    console.log("");
  }

  static logAttemptStart(attempt, maxAttempts) {
    console.log(`🔄 === ATTEMPT ${attempt}/${maxAttempts} ===`);
  }

  static logCurrentStatus(currentCount, targetCount) {
    console.log(`📊 Current news in DB: ${currentCount}/${targetCount}`);
  }

  static logTargetReachedButContinuing() {
    console.log(`🔄 Target reached but continuing API call for fresh data...`);
  }

  static logPageInfo(page, news) {
    const recIds = news.slice(0, 5).map((n) => n.recId);
    console.log(`📄 Page ${page}: First 5 recId: [${recIds.join(", ")}]`);
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
    console.log("");
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
    console.log(`🏁 === FINAL RESULT ===`);
    console.log(`🎯 Target: ${targetCount}`);
    console.log(`📊 Achieved: ${finalCount}`);
    console.log(`🔄 Attempts used: ${attemptsUsed}/${maxAttempts}`);
    console.log(`✅ Status: ${status}`);
  }
}

module.exports = NewsLogger;
