// ===================== Logger =====================
// DurianGardensLogger provides structured logging for the durian gardens fetch/process workflow.
export default class DurianGardensLogger {
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

  static logPageInfo(year, page, records) {
    console.log(`📄 Year: ${year} Page: ${page} Length: ${records.length}`);
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
