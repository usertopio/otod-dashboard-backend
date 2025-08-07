const { connectionDB } = require("../../config/db/db.conf.js");
const { COMMUNITIES_CONFIG, STATUS } = require("../../utils/constants");
const CommunitiesProcessor = require("./communitiesProcessor");
const CommunitiesLogger = require("./communitiesLogger");

class CommunitiesService {
  static async resetOnlyCommunitiesTable() {
    const connection = connectionDB.promise();

    try {
      console.log("🧹 Resetting ONLY communities table...");

      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE communities");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("✅ Only communities table reset - next ID will be 1");
      return { success: true, message: "Only communities table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting communities table:", error);
      throw error;
    }
  }

  static async fetchCommunities(targetCount, maxAttempts) {
    await this.resetOnlyCommunitiesTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    console.log(
      `🎯 Target: ${targetCount} communities, Max attempts: ${maxAttempts}`
    );

    while (attempt <= maxAttempts) {
      CommunitiesLogger.logAttemptStart(attempt, maxAttempts);

      currentCount = await this._getDatabaseCount();
      CommunitiesLogger.logCurrentStatus(currentCount, targetCount);

      attemptsUsed++;
      const result = await CommunitiesProcessor.fetchAndProcessData();

      CommunitiesLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

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
