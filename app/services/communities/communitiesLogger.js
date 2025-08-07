// ===================== Logger =====================
// CommunitiesLogger provides structured logging for the communities fetch/process workflow.
class CommunitiesLogger {
  // Log the start of the target/attempts
  static logTargetStart(targetCount, maxAttempts) {
    console.log(
      `🎯 Target: ${targetCount} communities, Max attempts: ${maxAttempts}`
    );
    console.log("");
  }

  // Log the start of an attempt
  static logAttemptStart(attempt, maxAttempts) {
    console.log(`\n🔄 === ATTEMPT ${attempt}/${maxAttempts} ===`);
  }

  // Log the current status of the database
  static logCurrentStatus(currentCount, targetCount) {
    console.log(`📊 Current communities in DB: ${currentCount}/${targetCount}`);
  }

  // Log when the target is reached but continuing
  static logTargetReachedButContinuing() {
    console.log(`🔄 Target reached but continuing API call for fresh data...`);
  }

  // Log info for each API page
  static logPageInfo(page, communities) {
    console.log(`📄 Page ${page}: Length: ${communities.length}`);
  }

  // Log API summary after deduplication
  static logApiSummary(totalFromAPI, uniqueFromAPI) {
    console.log(`📊 Total from API: ${totalFromAPI}, Unique: ${uniqueFromAPI}`);
  }

  // Log the results of a single attempt
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

  // Log when the target is reached
  static logTargetReached(targetCount, attemptsUsed) {
    console.log(
      `🎯 Target of ${targetCount} reached after ${attemptsUsed} attempts ✅`
    );
  }

  // Log the final results of the fetch operation
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

// ===================== Exports =====================
module.exports = CommunitiesLogger;
