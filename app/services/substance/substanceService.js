const { connectionDB } = require("../../config/db/db.conf.js");
const { SUBSTANCE_CONFIG, STATUS } = require("../../utils/constants");
const SubstanceProcessor = require("./substanceProcessor");
const SubstanceLogger = require("./substanceLogger");

class SubstanceService {
  // 🔧 ADD: Reset only substance table (same as water)
  static async resetOnlySubstanceTable() {
    const connection = connectionDB.promise();

    try {
      console.log("🧹 Resetting ONLY substance table...");

      // Disable foreign key checks
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");

      // Delete only substance
      await connection.query("TRUNCATE TABLE substance");

      // Re-enable foreign key checks
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("✅ Only substance table reset - next ID will be 1");
      return { success: true, message: "Only substance table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting substance table:", error);
      throw error;
    }
  }

  // 🔧 UPDATE: Follow exact water template
  static async fetchSubstanceUntilTarget(targetCount, maxAttempts) {
    // 🔧 ADD: Reset substance table before fetching
    await this.resetOnlySubstanceTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    console.log(
      `🎯 Target: ${targetCount} substance records, Max attempts: ${maxAttempts}`
    );

    // Main processing loop
    while (attempt <= maxAttempts) {
      SubstanceLogger.logAttemptStart(attempt, maxAttempts);

      // Get current count before this attempt
      currentCount = await this._getDatabaseCount();
      SubstanceLogger.logCurrentStatus(currentCount, targetCount);

      // Always make API call
      attemptsUsed++;
      const result = await SubstanceProcessor.fetchAndProcessData();

      // Log detailed metrics for this attempt
      SubstanceLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

      // Stop when target is reached
      if (currentCount >= targetCount) {
        SubstanceLogger.logTargetReached(targetCount, attemptsUsed);
        break;
      }
    }

    return this._buildFinalResult(targetCount, attemptsUsed, maxAttempts);
  }

  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM substance");
    return result[0].total;
  }

  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this._getDatabaseCount();
    const status =
      finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;

    SubstanceLogger.logFinalResults(
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

module.exports = SubstanceService;
