// ===================== Logger =====================
// AvgPriceLogger provides structured logging for the avg price fetch/process workflow.
export default class AvgPriceLogger {
  static logAttemptStart(attempt, maxAttempts) {
    console.log(
      `\n🚦 Attempt ${attempt} of ${maxAttempts} to fetch/process avg price data`
    );
  }

  static logCurrentStatus(currentCount, targetCount, type = "avg price") {
    console.log(`🔄 Current ${type} records: ${currentCount}/${targetCount}`);
  }

  static logTargetReached(targetCount, attemptsUsed) {
    console.log(
      `✅ Target reached: ${targetCount} records after ${attemptsUsed} attempts`
    );
  }

  static logFinalResults(
    targetCount,
    achieved,
    attemptsUsed,
    maxAttempts,
    status
  ) {
    console.log(
      `🏁 Final Results: Target=${targetCount}, Achieved=${achieved}, Attempts=${attemptsUsed}/${maxAttempts}, Status=${status}`
    );
  }

  static logAttemptResults(attempt, result) {
    console.log(`📈 Attempt ${attempt} completed:`);
    console.log(`   ➕ Inserted: ${result.inserted}`);
    console.log(`   🔄 Updated: ${result.updated}`);
    console.log(`   ❌ Errors: ${result.errors}`);
    if (result.totalAfter !== undefined) {
      console.log(`   📊 Total now: ${result.totalAfter}`);
    }
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
    if (result.totalProcessingOperations !== undefined) {
      console.log(
        `📋 Total processing operations: ${result.totalProcessingOperations}`
      );
    }
    if (result.recordsInDbNotInAPI !== undefined) {
      console.log(
        `📍 Records in DB but not in current API: ${result.recordsInDbNotInAPI}`
      );
    }
    if (result.growth !== undefined) {
      console.log(`⏱️ Database growth: ${result.growth} records`);
    }
  }

  static _logErrorRecIds(result) {
    if (result.errorRecIds && result.errorRecIds.length > 0) {
      console.log(
        `\n❌ ERROR AVG PRICE RECORDS (${result.errorRecIds.length}):`
      );
      console.log(`   [${result.errorRecIds.slice(0, 10).join(", ")}]`);
    }
  }

  static logPageInfo(page, records) {
    const safeRecords = Array.isArray(records) ? records : [];
    console.log(`📄 Page: ${page} Length: ${safeRecords.length}`);
  }

  static logApiSummary(totalFromAPI, uniqueCount) {
    console.log(`📊 Total from API: ${totalFromAPI}, Unique: ${uniqueCount}`);
  }
}
