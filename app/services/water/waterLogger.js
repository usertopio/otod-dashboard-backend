// ===================== Logger =====================
// WaterLogger provides structured logging for the water fetch/process workflow.
export default class WaterLogger {
  static logTargetStart(targetCount, maxAttempts) {
    console.log(
      `🎯 Target: ${targetCount} water records, Max attempts: ${maxAttempts}`
    );
    console.log(`📝 Note: Single API call with no pagination\n`);
  }

  static logAttemptStart(attempt, maxAttempts) {
    console.log(`\n🔄 === ATTEMPT ${attempt}/${maxAttempts} ===`);
  }

  static logCurrentStatus(currentCount, targetCount) {
    console.log(
      `📊 Current water records in DB: ${currentCount}/${targetCount}`
    );

    if (currentCount < targetCount) {
      console.log(
        `📊 Need ${
          targetCount - currentCount
        } more water records - calling API...`
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

  static logApiSummary(totalFromAPI, uniqueCount) {
    console.log(`📊 Total from API: ${totalFromAPI}, Unique: ${uniqueCount}`);
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

  static _logErrorRecIds(result) {
    if (result.errorRecIds.length > 0) {
      console.log(`\n❌ ERROR WATER RECORDS (${result.errorRecIds.length}):`);
      console.log(`   [${result.errorRecIds.slice(0, 10).join(", ")}]`);
    }
  }

  static logPageInfo(year, page, records) {
    const safeRecords = Array.isArray(records) ? records : [];
    console.log(`📄 Year: ${year} Page: ${page} Length: ${safeRecords.length}`);
  }
}
