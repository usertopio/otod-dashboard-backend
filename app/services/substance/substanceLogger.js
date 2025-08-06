class SubstanceLogger {
  static logTargetStart(targetCount, maxAttempts) {
    console.log(
      `🎯 Target: ${targetCount} substance records, Max attempts: ${maxAttempts}`
    );
    console.log("📝 Note: Single API call with no pagination");
    console.log("");
  }

  static logAttemptStart(attempt, maxAttempts) {
    console.log(`\n🔄 === ATTEMPT ${attempt}/${maxAttempts} ===`);
  }

  static logCurrentStatus(currentCount, targetCount) {
    console.log(
      `📊 Current substance records in DB: ${currentCount}/${targetCount}`
    );

    if (currentCount < targetCount) {
      console.log(
        `📊 Need ${
          targetCount - currentCount
        } more substance records - calling API...`
      );
    } else {
      console.log(
        `🔄 Target reached but continuing API call for fresh data...`
      );
    }
  }

  static logTargetReached(targetCount, attemptsUsed) {
    console.log(
      `🎯 Target of ${targetCount} reached after ${attemptsUsed} attempts`
    );
  }

  static logFinalResults(
    targetCount,
    achieved,
    attemptsUsed,
    maxAttempts,
    status
  ) {
    console.log(`\n🏁 === FINAL RESULT ===`);
    console.log(`🎯 Target: ${targetCount}`);
    console.log(`📊 Achieved: ${achieved}`);
    console.log(`🔄 Attempts used: ${attemptsUsed}/${maxAttempts}`);
    console.log(`✅ Status: ${status}`);
  }

  static logAttemptResults(attempt, result) {
    console.log(`📈 Attempt ${attempt} completed:`);
    console.log(`   ➕ Inserted: ${result.inserted}`);
    console.log(`   🔄 Updated: ${result.updated}`);
    console.log(`   ❌ Errors: ${result.errors}`);
    console.log(`   📊 Total now: ${result.totalAfter}`);

    this._logApiMetrics(result);
    this._logDatabaseMetrics(result);
    this._logInsights(result);
    this._logNewRecIds(result);
    this._logErrorRecIds(result);

    console.log("==========================================\n");
  }

  static _logApiMetrics(result) {
    console.log("\n📊 === API METRICS ===");
    console.log(
      `📥 Record amount from current API call: ${result.totalFromAPI}`
    );
    console.log(
      `🔍 Unique records from current API call: ${result.uniqueFromAPI}`
    );
    console.log(`🆕 New records amount: ${result.inserted}`);
    console.log(`🔄 Duplicated data amount: ${result.duplicatedDataAmount}`);
  }

  static _logDatabaseMetrics(result) {
    console.log("\n📊 === DATABASE METRICS ===");
    console.log(`📊 Previous amount records in table: ${result.totalBefore}`);
    console.log(`📈 Current amount records in table: ${result.totalAfter}`);
    console.log(`➕ Records INSERTED: ${result.inserted}`);
    console.log(`🔄 Records UPDATED: ${result.updated}`);
    console.log(`❌ Records with ERRORS: ${result.errors}`);
  }

  static _logInsights(result) {
    console.log("\n📊 === ADDITIONAL INSIGHTS ===");
    console.log(
      `📋 Total processing operations: ${result.totalProcessingOperations}`
    );
    console.log(
      `📍 Records in DB but not in current API: ${result.recordsInDbNotInAPI}`
    );
    console.log(`⏱️ Database growth: ${result.growth} records`);
  }

  static _logNewRecIds(result) {
    if (result.newRecIds.length > 0) {
      console.log(`\n🆕 NEW SUBSTANCE RECORDS (${result.newRecIds.length}):`);
      console.log(`   [${result.newRecIds.slice(0, 10).join(", ")}]`);
    }
  }

  static _logErrorRecIds(result) {
    if (result.errorRecIds.length > 0) {
      console.log(
        `\n❌ ERROR SUBSTANCE RECORDS (${result.errorRecIds.length}):`
      );
      console.log(`   [${result.errorRecIds.slice(0, 10).join(", ")}]`);
    }
  }

  static logPageInfo(page, substanceRecords) {
    console.log(
      `📄 Page ${page}: First 5 substance records: [${substanceRecords
        .slice(0, 5)
        .map((s) => `${s.substance}(${s.operMonth})`)
        .join(", ")}]`
    );
    console.log(`📄 Page ${page}: Length: ${substanceRecords.length}`);
  }

  static logApiSummary(totalFromAPI, uniqueCount) {
    console.log(`📊 Total from API: ${totalFromAPI}, Unique: ${uniqueCount}`);
  }
}

module.exports = SubstanceLogger;
