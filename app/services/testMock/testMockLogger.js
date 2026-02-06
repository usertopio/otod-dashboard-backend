// Logger for test mock operations

export default class TestMockLogger {
  static logAttemptStart(attempt, maxAttempts) {
    console.log(`\n🔄 === ATTEMPT ${attempt}/${maxAttempts} ===`);
  }

  static logAttemptResults(attempt, result) {
    console.log(`📈 Attempt ${attempt} completed:`);
    console.log(`   ➕ Inserted: ${result.inserted}`);
    console.log(`   🔄 Updated: ${result.updated}`);
    console.log(`   ❌ Errors: ${result.errors}`);
    console.log(`   📊 Total now: ${result.totalAfter}`);
    console.log("==========================================\n");
  }

  static logFinalResults(target, achieved, attemptsUsed, maxAttempts, status) {
    console.log(`🏁 === FINAL RESULT ===`);
    console.log(`🎯 Target: ${target}`);
    console.log(`📊 Achieved: ${achieved}`);
    console.log(`🔄 Attempts used: ${attemptsUsed}/${maxAttempts}`);
    console.log(`✅ Status: ${status}`);
  }

  static logDataFetchSuccess(recordCount) {
    console.log(`✅ API fetch successful: ${recordCount} records retrieved`);
  }

  static logDataFetchFailure(error) {
    console.log(`❌ API fetch failed: ${error.message}`);
    console.log(`⚠️  Table NOT truncated - preserving existing data`);
  }

  static logNoDataReceived() {
    console.log(`⚠️  No data received from API`);
    console.log(`⚠️  Table NOT truncated - preserving existing data`);
  }

  static logTableResetSkipped() {
    console.log(`🛡️  Table reset SKIPPED - old data preserved`);
  }

  static logTableResetExecuted() {
    console.log(`🧹 Table reset EXECUTED - old data removed`);
  }
}
