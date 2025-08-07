class DurianGardensLogger {
  static logAttemptStart(attempt, maxAttempts) {
    console.log(`\n🔄 === ATTEMPT ${attempt}/${maxAttempts} ===`);
  }

  static logCurrentStatus(currentCount, targetCount, type = "durian gardens") {
    console.log(`📊 Current ${type} in DB: ${currentCount}/${targetCount}`);

    if (currentCount < targetCount) {
      console.log(
        `📊 Need ${
          targetCount - currentCount
        } more ${type} - calling BOTH APIs...`
      );
    } else {
      console.log(
        `🔄 Target reached but continuing API calls for fresh data...`
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

    if (result.recordsInDbNotInAPI > 0) {
      console.log(
        `📍 Records in DB but not in current API: ${result.recordsInDbNotInAPI}`
      );
    }

    console.log("==========================================\n");
  }

  static _logApiMetrics(result) {
    console.log("\n📊 === API METRICS ===");
    console.log(`📥 Total unique gardens after merge: ${result.totalFromAPI}`);
    console.log(
      `📥 Records from GetLands (paginated): ${result.totalFromGetLands || 0}`
    );
    console.log(
      `📥 Records from GetLandGeoJSON (single): ${
        result.totalFromGetLandGeoJSON || 0
      }`
    );
    console.log(`🔍 Unique records after merge: ${result.uniqueFromAPI}`);
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

  static _logErrorRecIds(result) {
    if (result.errorRecIds.length > 0) {
      console.log(`\n❌ ERROR LAND_IDS (${result.errorRecIds.length}):`);
      console.log(`   [${result.errorRecIds.slice(0, 10).join(", ")}]`);
    }
  }

  static logPageInfo(page, records, apiType) {
    console.log(`📄 ${apiType} Page ${page}: Length: ${records.length}`);
  }

  static logApiSummary(
    totalMerged,
    uniqueCount,
    fromGetLands,
    fromGetLandGeoJSON
  ) {
    console.log(``);
    console.log(`📊 === API SUMMARY ===`);
    console.log(`📞 GetLands (paginated): ${fromGetLands} records`);
    console.log(`📞 GetLandGeoJSON (single): ${fromGetLandGeoJSON} records`);
    console.log(`🔗 Merged unique gardens: ${totalMerged}`);
  }
}

module.exports = DurianGardensLogger;
