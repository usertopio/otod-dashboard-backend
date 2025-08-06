const { connectionDB } = require("../../config/db/db.conf.js");
const { MERCHANTS_CONFIG, STATUS } = require("../../utils/constants");
const MerchantsProcessor = require("./merchantsProcessor");
const MerchantsLogger = require("./merchantsLogger");

class MerchantsService {
  // 🔧 ADD: Reset only merchants table
  static async resetOnlyMerchantsTable() {
    const connection = connectionDB.promise();

    try {
      console.log("🧹 Resetting ONLY merchants table...");

      // Disable foreign key checks
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");

      // Delete only merchants
      await connection.query("TRUNCATE TABLE merchants");

      // Re-enable foreign key checks
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("✅ Only merchants table reset - next ID will be 1");
      return { success: true, message: "Only merchants table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting merchants table:", error);
      throw error;
    }
  }

  static async fetchMerchantsUntilTarget(targetCount, maxAttempts) {
    // 🔧 ADD: Reset merchants table before fetching
    await this.resetOnlyMerchantsTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    console.log(
      `🎯 Target: ${targetCount} merchants, Max attempts: ${maxAttempts}`
    );

    // Main processing loop
    while (attempt <= maxAttempts) {
      MerchantsLogger.logAttemptStart(attempt, maxAttempts);

      // Get current count before this attempt
      currentCount = await this._getDatabaseCount();
      MerchantsLogger.logCurrentStatus(currentCount, targetCount);

      // Always make API call
      attemptsUsed++;
      const result = await MerchantsProcessor.fetchAndProcessData();

      // Log detailed metrics for this attempt
      MerchantsLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

      // Stop when target is reached
      if (currentCount >= targetCount) {
        MerchantsLogger.logTargetReached(targetCount, attemptsUsed);
        break;
      }
    }

    return this._buildFinalResult(targetCount, attemptsUsed, maxAttempts);
  }

  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM merchants");
    return result[0].total;
  }

  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this._getDatabaseCount();
    const status =
      finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;

    MerchantsLogger.logFinalResults(
      targetCount,
      finalCount,
      attemptsUsed,
      maxAttempts,
      status
    );

    return {
      message: `Fetch loop completed - ${status}`,
      target: targetCount,
      achieved: finalCount,
      attemptsUsed: attemptsUsed,
      maxAttempts: maxAttempts,
      status: status,
      reachedTarget: finalCount >= targetCount,
    };
  }
}

module.exports = MerchantsService;
