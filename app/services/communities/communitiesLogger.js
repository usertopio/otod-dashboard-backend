class CommunitiesLogger {
  // 🔧 EXACT MATCH: Target start like farmers
  static logTargetStart(targetCount, maxAttempts) {
    console.log(
      `🎯 Target: ${targetCount} communities, Max attempts: ${maxAttempts}`
    );
    console.log("");
  }

  // 🔧 EXACT MATCH: Attempt start like farmers
  static logAttemptStart(attempt, maxAttempts) {
    console.log(`🔄 === ATTEMPT ${attempt}/${maxAttempts} ===`);
  }

  // 🔧 EXACT MATCH: Current status like farmers
  static logCurrentStatus(currentCount, targetCount) {
    console.log(`📊 Current communities in DB: ${currentCount}/${targetCount}`);
  }

  // 🔧 EXACT MATCH: Target reached but continuing like farmers
  static logTargetReachedButContinuing() {
    console.log(`🔄 Target reached but continuing API call for fresh data...`);
  }

  // 🔧 EXACT MATCH: Page info like farmers
  static logPageInfo(page, communities) {
    const recIds = communities.slice(0, 5).map((c) => c.recId);
    console.log(`📄 Page ${page}: First 5 recId: [${recIds.join(", ")}]`);
    console.log(`📄 Page ${page}: Length: ${communities.length}`);
  }

  // 🔧 EXACT MATCH: API summary like farmers
  static logApiSummary(totalFromAPI, uniqueFromAPI) {
    console.log(`📊 Total from API: ${totalFromAPI}, Unique: ${uniqueFromAPI}`);
  }

  // 🔧 EXACT MATCH: Attempt results like farmers
  static logAttemptResults(attempt, result) {
    console.log(`📈 Attempt ${attempt} completed:`);
    console.log(`   ➕ Inserted: ${result.inserted}`);
    console.log(`   🔄 Updated: ${result.updated}`);
    console.log(`   ❌ Errors: ${result.errors}`);
    console.log(`   📊 Total now: ${result.totalAfter}`);
    console.log("");
  }

  // 🔧 EXACT MATCH: Target reached like farmers
  static logTargetReached(targetCount, attemptsUsed) {
    console.log(
      `🎯 Target of ${targetCount} reached after ${attemptsUsed} attempts ✅`
    );
  }

  // 🔧 EXACT MATCH: Final result like farmers
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

module.exports = CommunitiesLogger;
