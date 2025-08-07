const { connectionDB } = require("../../config/db/db.conf.js");
const { SUBSTANCE_CONFIG, STATUS } = require("../../utils/constants");
const SubstanceProcessor = require("./substanceProcessor");
const SubstanceLogger = require("./substanceLogger");

class SubstanceService {
  static async resetOnlySubstanceTable() {
    const connection = connectionDB.promise();

    try {
      console.log("==========================================");
      console.log(
        `🔄  Calling API Endpoint: {{LOCAL_HOST}}/api/fetchSubstance`
      );
      console.log("==========================================\n");

      console.log("🧹 Resetting ONLY substance table...");

      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE substance");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("✅ Only substance table reset - next ID will be 1");
      return { success: true, message: "Only substance table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting substance table:", error);
      throw error;
    }
  }

  static async fetchSubstance(targetCount, maxAttempts) {
    await this.resetOnlySubstanceTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    console.log(
      `🎯 Target: ${targetCount} substance records, Max attempts: ${maxAttempts}`
    );

    while (attempt <= maxAttempts) {
      SubstanceLogger.logAttemptStart(attempt, maxAttempts);

      currentCount = await this._getDatabaseCount();
      SubstanceLogger.logCurrentStatus(currentCount, targetCount);

      attemptsUsed++;
      const result = await SubstanceProcessor.fetchAndProcessData();

      SubstanceLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

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
