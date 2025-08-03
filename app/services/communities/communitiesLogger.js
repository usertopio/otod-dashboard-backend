class CommunitiesLogger {
  // 🔧 EXACT MATCH: Target start like farmers
  static logTargetStart(targetCount, maxAttempts) {
    console.log(
      `🎯 Target: ${targetCount} communities, Max attempts: ${maxAttempts}`
    );
    console.log("");
  }

  // 🔧 EXACT MATCH: Attempt start like farmers
  static logAttemptStart(attempt, maxAttempts, currentCount, targetCount) {
    console.log(`🔄 === ATTEMPT ${attempt}/${maxAttempts} ===`);
    console.log(`📊 Current communities in DB: ${currentCount}/${targetCount}`);

    if (currentCount >= targetCount) {
      console.log(
        `🔄 Target reached but continuing API call for fresh data...`
      );
    }
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
  static logAttemptResults(attempt, inserted, updated, errors, totalAfter) {
    console.log(`📈 Attempt ${attempt} completed:`);
    console.log(`   ➕ Inserted: ${inserted}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📊 Total now: ${totalAfter}`);
    console.log("");
  }

  // 🔧 EXACT MATCH: API metrics like farmers
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

  // 🔧 EXACT MATCH: Database metrics like farmers
  static logDatabaseMetrics(result) {
    console.log(`📊 === DATABASE METRICS ===`);
    console.log(`📊 Previous amount records in table: ${result.totalBefore}`);
    console.log(`📈 Current amount records in table: ${result.totalAfter}`);
    console.log(`➕ Records INSERTED: ${result.inserted}`);
    console.log(`🔄 Records UPDATED: ${result.updated}`);
    console.log(`❌ Records with ERRORS: ${result.errors}`);
    console.log("");
  }

  // 🔧 EXACT MATCH: Additional insights like farmers
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

  // 🔧 EXACT MATCH: New record IDs like farmers
  static logNewRecordIds(result) {
    if (result.newRecIds && result.newRecIds.length > 0) {
      console.log(`🆕 NEW REC_IDS INSERTED: [${result.newRecIds.join(", ")}]`);
    } else {
      console.log(`🆕 NEW REC_IDS INSERTED: None`);
    }
    console.log("==========================================");
    console.log("");
  }

  // 🔧 EXACT MATCH: Target reached like farmers
  static logTargetReached(currentCount, targetCount, attempts) {
    console.log(
      `🎯 Target of ${targetCount} reached after ${attempts} attempts`
    );
    console.log("");
  }

  // 🔧 EXACT MATCH: Final result like farmers
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

module.exports = CommunitiesLogger;
