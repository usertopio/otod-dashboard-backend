class GapLogger {
  static logTargetStart(targetCount, maxAttempts) {
    console.log(
      `🎯 Target: ${targetCount} gap certificates, Max attempts: ${maxAttempts}`
    );
    console.log("");
  }

  static logAttemptStart(attempt, maxAttempts, currentCount, targetCount) {
    console.log(`🔄 === ATTEMPT ${attempt}/${maxAttempts} ===`);
    console.log(
      `📊 Current gap certificates in DB: ${currentCount}/${targetCount}`
    );
  }

  static logTargetReachedButContinuing() {
    console.log(`🔄 Target reached but continuing API call for fresh data...`);
  }

  static logPageInfo(page, crops) {
    const recIds = crops.slice(0, 5).map((c) => c.recId);
    console.log(`📄 Page ${page}: First 5 crop recId: [${recIds.join(", ")}]`);
    console.log(`📄 Page ${page}: Total crops: ${crops.length}`);

    // Count GAP certificates in this page
    const gapCount = crops.filter(
      (crop) => crop.gapCertNumber && crop.gapCertNumber.trim() !== ""
    ).length;
    console.log(`📄 Page ${page}: GAP certificates: ${gapCount}`);
  }

  static logApiSummary(totalFromAPI, uniqueFromAPI) {
    console.log(
      `📊 Total crops from API: ${totalFromAPI}, Unique GAP certificates: ${uniqueFromAPI}`
    );
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
    console.log(`📥 Total crops from API call: ${result.totalFromAPI}`);
    console.log(
      `🔍 Unique GAP certificates extracted: ${result.uniqueFromAPI}`
    );
    console.log(`🆕 New GAP certificates: ${result.inserted}`);
    console.log(
      `🔄 Duplicated GAP certificates: ${result.duplicatedDataAmount}`
    );
    console.log("");
  }

  static logDatabaseMetrics(result) {
    console.log(`📊 === DATABASE METRICS ===`);
    console.log(`📊 Previous GAP certificates in table: ${result.totalBefore}`);
    console.log(`📈 Current GAP certificates in table: ${result.totalAfter}`);
    console.log(`➕ Records INSERTED: ${result.inserted}`);
    console.log(`🔄 Records UPDATED: ${result.updated}`);
    console.log(`❌ Records with ERRORS: ${result.errors}`);
    console.log("");
  }

  static logAdditionalInsights(result) {
    console.log(`📊 === ADDITIONAL INSIGHTS ===`);
    console.log(`🔄 Total attempts made: ${result.attempts}`);
    console.log(
      `📈 Net GAP certificates added: ${result.totalAfter - result.totalBefore}`
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
        (result.duplicatedDataAmount /
          (result.uniqueFromAPI + result.duplicatedDataAmount)) *
        100
      ).toFixed(1);
      console.log(`🔄 Duplicate rate: ${duplicateRate}%`);
    }

    console.log("");
  }
}

module.exports = GapLogger;
