const { connectionDB } = require("../../config/db/db.conf.js");
const { GAP_CONFIG, STATUS } = require("../../utils/constants");
const GapProcessor = require("./gapProcessor");
const GapLogger = require("./gapLogger");

class GapService {
  static async resetOnlyGapTable() {
    const connection = connectionDB.promise();

    try {
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchCrops`
      );
      console.log("==========================================\n");

      console.log("🧹 Resetting ONLY gap table...");

      await connection.query("SET FOREIGN_KEY_CHECKS = 0");

      await connection.query("TRUNCATE TABLE gap");

      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("✅ Only gap table reset - next ID will be 1");
      return { success: true, message: "Only gap table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting gap table:", error);
      throw error;
    }
  }

  static async fetchGap(targetCount, maxAttempts) {
    await this.resetOnlyGapTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    console.log(
      `🎯 Target: ${targetCount} gap certificates, Max attempts: ${maxAttempts}`
    );

    while (attempt <= maxAttempts) {
      GapLogger.logAttemptStart(attempt, maxAttempts);

      currentCount = await this._getDatabaseCount();
      GapLogger.logCurrentStatus(currentCount, targetCount);

      attemptsUsed++;
      const result = await GapProcessor.fetchAndProcessData();

      GapLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

      if (currentCount >= targetCount) {
        GapLogger.logTargetReached(targetCount, attemptsUsed);
        break;
      }
    }

    return this._buildFinalResult(targetCount, attemptsUsed, maxAttempts);
  }

  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM gap");
    return result[0].total;
  }

  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this._getDatabaseCount();
    const status =
      finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;

    GapLogger.logFinalResults(
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

module.exports = GapService;
