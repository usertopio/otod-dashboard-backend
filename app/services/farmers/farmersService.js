const { connectionDB } = require("../../config/db/db.conf.js");
const { FARMERS_CONFIG, STATUS } = require("../../utils/constants");
const FarmersProcessor = require("./farmersProcessor");
const FarmersLogger = require("./farmersLogger");

class FarmersService {
  // 🔧 ADD: Reset only farmers table
  static async resetOnlyFarmersTable() {
    const connection = connectionDB.promise();

    try {
      console.log("🧹 Resetting ONLY farmers table...");

      // Disable foreign key checks
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");

      // Delete only farmers
      await connection.query("TRUNCATE TABLE farmers");

      // Re-enable foreign key checks
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log(
        "✅ Only farmers table reset - gap/operations kept with orphaned references"
      );
      return { success: true, message: "Only farmers table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting farmers table:", error);
      throw error;
    }
  }

  static async fetchFarmersUntilTarget(targetCount, maxAttempts) {
    // 🔧 ADD: Reset farmers table before fetching
    await this.resetOnlyFarmersTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    console.log(
      `🎯 Target: ${targetCount} farmers, Max attempts: ${maxAttempts}`
    );

    // Main processing loop
    while (attempt <= maxAttempts) {
      FarmersLogger.logAttemptStart(attempt, maxAttempts);

      // Get current count before this attempt
      currentCount = await this._getDatabaseCount();
      FarmersLogger.logCurrentStatus(currentCount, targetCount);

      // Always make API call
      attemptsUsed++;
      const result = await FarmersProcessor.fetchAndProcessData();

      // Log detailed metrics for this attempt
      FarmersLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

      // Stop when target is reached
      if (currentCount >= targetCount) {
        FarmersLogger.logTargetReached(targetCount, attemptsUsed);
        break;
      }
    }

    return this._buildFinalResult(targetCount, attemptsUsed, maxAttempts);
  }

  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM farmers");
    return result[0].total;
  }

  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this._getDatabaseCount();
    const status =
      finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;

    FarmersLogger.logFinalResults(
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

module.exports = FarmersService;
