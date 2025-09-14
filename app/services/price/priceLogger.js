// ===================== Logger =====================
// PriceLogger provides structured logging for the avg price fetch/process workflow.
export default class PriceLogger {
  /**
   * Logs the start of an attempt.
   */
  static logAttemptStart(attempt, maxAttempts) {
    console.log(`\n🚀 Attempt ${attempt} of ${maxAttempts}`);
  }

  /**
   * Logs the current status of the database.
   */
  static logCurrentStatus(currentCount, targetCount) {
    console.log(
      `📊 Current avg price records in DB: ${currentCount}/${targetCount}`
    );

    if (currentCount < targetCount) {
      console.log(
        `📊 Need ${
          targetCount - currentCount
        } more avg price records - calling API...`
      );
    } else {
      console.log(
        `🔄 Target reached but continuing API call for fresh data...`
      );
    }
  }

  /**
   * Logs when the target is reached.
   */
  static logTargetReached(targetCount, attemptsUsed) {
    console.log(
      `🎯 Target of ${targetCount} reached after ${attemptsUsed} attempts`
    );
  }

  /**
   * Logs the final results of the fetch operation.
   */
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

  /**
   * Logs the results of a single attempt.
   */
  static logAttemptResults(attempt, result) {
    console.log(`📈 Attempt ${attempt} completed:`);
    console.log(`   ➕ Inserted: ${result.inserted}`);
    console.log(`   🔄 Updated: ${result.updated}`);
    console.log(`   ❌ Errors: ${result.errors}`);
    console.log(`   📊 Total now: ${result.totalAfter}`);
    console.log("==========================================\n");
  }

  /**
   * Logs API metrics for the current batch.
   */
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

  /**
   * Logs database metrics for the current batch.
   */
  static _logDatabaseMetrics(result) {
    console.log("\n📊 === DATABASE METRICS ===");
    console.log(`📊 Previous amount records in table: ${result.totalBefore}`);
    console.log(`📈 Current amount records in table: ${result.totalAfter}`);
    console.log(`➕ Records INSERTED: ${result.inserted}`);
    console.log(`🔄 Records UPDATED: ${result.updated}`);
    console.log(`❌ Records with ERRORS: ${result.errors}`);
  }

  /**
   * Logs additional insights for the current batch.
   */
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

  /**
   * Logs error recIds for failed upserts.
   */
  static _logErrorRecIds(result) {
    if (result.errorRecIds && result.errorRecIds.length > 0) {
      console.log(
        `\n❌ ERROR AVG PRICE RECORDS (${result.errorRecIds.length}):`
      );
      console.log(`   [${result.errorRecIds.slice(0, 10).join(", ")}]`);
    }
  }

  /**
   * Logs info for each API page.
   */
  static logPageInfo(page, records) {
    const safeRecords = Array.isArray(records) ? records : [];
    console.log(`📄 Page ${page}: Length: ${safeRecords.length}`);
  }

  /**
   * Logs API summary after deduplication.
   */
  static logApiSummary(totalFromAPI, uniqueCount) {
    console.log(`📊 Total from API: ${totalFromAPI}, Unique: ${uniqueCount}`);
  }
}
