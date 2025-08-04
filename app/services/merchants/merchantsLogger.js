class MerchantsLogger {
  static logTargetStart(targetCount, maxAttempts) {
    console.log(
      `🎯 Target: ${targetCount} merchants, Max attempts: ${maxAttempts}`
    );
    console.log("");
  }

  static logAttemptStart(attempt, maxAttempts, currentCount, targetCount) {
    console.log(`🔄 === ATTEMPT ${attempt}/${maxAttempts} ===`);
    console.log(`📊 Current merchants in DB: ${currentCount}/${targetCount}`);
  }

  static logTargetReachedButContinuing() {
    console.log(`🔄 Target reached but continuing API call for fresh data...`);
  }

  static logPageInfo(page, merchants) {
    const recIds = merchants.slice(0, 5).map((m) => m.recId);
    console.log(`📄 Page ${page}: First 5 recId: [${recIds.join(", ")}]`);
    console.log(`📄 Page ${page}: Length: ${merchants.length}`);
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
    console.log(`🔄 Total attempts made: ${result.attempts}`);
    console.log(
      `📈 Net records added: ${result.totalAfter - result.totalBefore}`
    );

    if (result.uniqueFromAPI > 0) {
      const successRate = (
        ((result.inserted + result.updated) / result.uniqueFromAPI) *
        100
      ).toFixed(1);
      console.log(`✅ Success rate: ${successRate}%`);
    }

    if (result.duplicatedDataAmount > 0) {
      const duplicateRate = (
        (result.duplicatedDataAmount / result.totalFromAPI) *
        100
      ).toFixed(1);
      console.log(`🔄 Duplicate rate: ${duplicateRate}%`);
    }

    console.log("");
  }
}

module.exports = MerchantsLogger;
