class NewsLogger {
  // EXACT MATCH to communities/farmers logging pattern
  static logTargetStart(targetCount, maxAttempts) {
    console.log(`🎯 Target: ${targetCount} news, Max attempts: ${maxAttempts}`);
    console.log("");
  }

  static logAttemptStart(attempt, maxAttempts, currentCount, targetCount) {
    console.log(`🔄 === ATTEMPT ${attempt}/${maxAttempts} ===`);
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

  static logAttemptResults(attempt, inserted, updated, errors, totalAfter) {
    console.log(`📈 Attempt ${attempt} completed:`);
    console.log(`   ➕ Inserted: ${inserted}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📊 Total now: ${totalAfter}`);
    console.log("");
  }

  static logApiMetrics(result) {
    console.log(`📊 === API METRICS ===`);
    console.log(
      `📥 Record amount from current API call: ${result.totalFromAPI}`
    );
    console.log(
      `🔍 Unique records from current API call: ${result.uniqueFromAPI}`
    );
    console.log(`🆕 New records amount: ${result.inserted}`);
    console.log(`🔄 Duplicated data amount: ${result.duplicatedDataAmount}`);
    console.log("");
  }

  static logDatabaseMetrics(result) {
    console.log(`📊 === DATABASE METRICS ===`);
    console.log(`📊 Previous amount records in table: ${result.totalBefore}`);
    console.log(`📈 Current amount records in table: ${result.totalAfter}`);
    console.log(`➕ Records INSERTED: ${result.inserted}`);
    console.log(`🔄 Records UPDATED: ${result.updated}`);
    console.log(`❌ Records with ERRORS: ${result.errors}`);
    console.log("");
  }

  static logAdditionalInsights(result) {
    console.log(`📊 === ADDITIONAL INSIGHTS ===`);
    console.log(
      `📋 Total processing operations: ${result.totalProcessingOperations}`
    );
    console.log(
      `📍 Records in DB but not in current API: ${result.recordsInDbNotInAPI}`
    );
    console.log(`⏱️ Database growth: ${result.growth} records`);
    console.log("");
  }

  static logNewRecordIds(result) {
    if (result.newRecIds && result.newRecIds.length > 0) {
      console.log(`🆕 NEW REC_IDS INSERTED: [${result.newRecIds.join(", ")}]`);
    } else {
      console.log(`🆕 NEW REC_IDS INSERTED: None`);
    }
    console.log("==========================================");
    console.log("");
  }

  static logTargetReached(currentCount, targetCount, attempts) {
    console.log(
      `🎯 Target of ${targetCount} reached after ${attempts} attempts`
    );
    console.log("");
  }

  static logFinalResults(result) {
    console.log("🏁 === FINAL RESULT ===");
    console.log(`🎯 Target: ${result.target}`);
    console.log(`📊 Achieved: ${result.achieved}`);
    console.log(
      `🔄 Attempts used: ${result.attemptsUsed}/${result.maxAttempts}`
    );
    console.log(`✅ Status: ${result.status}`);
  }
}

module.exports = NewsLogger;
