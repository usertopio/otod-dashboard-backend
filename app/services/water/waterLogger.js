class WaterLogger {
  static logTargetStart(targetCount, maxAttempts) {
    console.log(
      `🎯 Target: ${targetCount} water records, Max attempts: ${maxAttempts}`
    );
    console.log(`📝 Note: Single API call with no pagination\n`);
  }

  static logAttemptStart(
    currentAttempt,
    maxAttempts,
    currentCount,
    targetCount
  ) {
    console.log(`🔄 === ATTEMPT ${currentAttempt}/${maxAttempts} ===`);
    console.log(`📊 Current water records in DB: ${currentCount}`);
  }

  static logTargetReachedButContinuing() {
    console.log(`✅ Target reached, but continuing with remaining attempts...`);
  }

  static logApiCall(waterData) {
    if (waterData.length > 0) {
      const first5 = waterData
        .slice(0, 5)
        .map((w) => `${w.provinceName}(${w.operMonth})`)
        .join(", ");
      console.log(`📄 API Response: First 5 water records: [${first5}]`);
      console.log(`📄 API Response: Total records: ${waterData.length}`);
    } else {
      console.log(`📄 API Response: No water records found`);
    }
  }

  static logApiSummary(totalFromAPI, uniqueFromAPI) {
    console.log(`📊 Total from API: ${totalFromAPI}, Unique: ${uniqueFromAPI}`);
  }

  static logAttemptResults(attempt, inserted, updated, errors, totalAfter) {
    console.log(`📈 Attempt ${attempt} completed:`);
    console.log(`   ➕ Inserted: ${inserted}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📊 Total now: ${totalAfter}\n`);
  }

  static logApiMetrics(result) {
    console.log(`📊 === API METRICS ===`);
    console.log(`📥 Record amount from API call: ${result.totalFromAPI}`);
    console.log(`🔍 Unique records from API call: ${result.uniqueFromAPI}`);
    console.log(`🆕 New records amount: ${result.inserted}`);
    console.log(`🔄 Duplicated data amount: ${result.duplicatedDataAmount}\n`);
  }

  static logDatabaseMetrics(result) {
    console.log(`📊 === DATABASE METRICS ===`);
    console.log(`📊 Previous water records in table: ${result.totalBefore}`);
    console.log(`📈 Current water records in table: ${result.totalAfter}`);
    console.log(`➕ Records INSERTED: ${result.inserted}`);
    console.log(`🔄 Records UPDATED: ${result.updated}`);
    console.log(`❌ Records with ERRORS: ${result.errors}\n`);
  }

  static logAdditionalInsights(result) {
    console.log(`📊 === ADDITIONAL INSIGHTS ===`);
    console.log(`🔄 Total attempts made: ${result.attempts}`);
    console.log(`📈 Net records added: ${result.inserted}`);
    const successRate =
      result.uniqueFromAPI > 0
        ? (
            ((result.inserted + result.updated) / result.uniqueFromAPI) *
            100
          ).toFixed(1)
        : 0;
    console.log(`✅ Success rate: ${successRate}%\n`);
  }
}

module.exports = WaterLogger;
