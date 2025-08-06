const { connectionDB } = require("../../config/db/db.conf.js");
const { COMMUNITIES_CONFIG, STATUS } = require("../../utils/constants");
const CommunitiesProcessor = require("./communitiesProcessor");
const CommunitiesLogger = require("./communitiesLogger");

class CommunitiesService {
  // 🔧 ADD: Reset only communities table
  static async resetOnlyCommunitiesTable() {
    const connection = connectionDB.promise();

    try {
      console.log("🧹 Resetting ONLY communities table...");

      // Disable foreign key checks
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");

      // Delete only communities
      await connection.query("TRUNCATE TABLE communities");

      // Re-enable foreign key checks
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("✅ Only communities table reset - next ID will be 1");
      return { success: true, message: "Only communities table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting communities table:", error);
      throw error;
    }
  }

  static async fetchCommunitiesUntilTarget(targetCount, maxAttempts) {
    // 🔧 ADD: Reset communities table before fetching
    await this.resetOnlyCommunitiesTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    console.log(
      `🎯 Target: ${targetCount} communities, Max attempts: ${maxAttempts}`
    );

    // Main processing loop
    while (attempt <= maxAttempts) {
      CommunitiesLogger.logAttemptStart(attempt, maxAttempts);

      // Get current count before this attempt
      currentCount = await this._getDatabaseCount();
      CommunitiesLogger.logCurrentStatus(currentCount, targetCount);

      // Always make API call
      attemptsUsed++;
      const result = await CommunitiesProcessor.fetchAndProcessData();

      // Log detailed metrics for this attempt
      CommunitiesLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

      // Stop when target is reached
      if (currentCount >= targetCount) {
        CommunitiesLogger.logTargetReached(targetCount, attemptsUsed);
        break;
      }
    }

    return this._buildFinalResult(targetCount, attemptsUsed, maxAttempts);
  }

  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM communities");
    return result[0].total;
  }

  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this._getDatabaseCount();
    const status =
      finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;

    CommunitiesLogger.logFinalResults(
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

module.exports = CommunitiesService;
