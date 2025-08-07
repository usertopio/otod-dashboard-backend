const { connectionDB } = require("../../config/db/db.conf.js");
const { WATER_CONFIG, STATUS } = require("../../utils/constants");
const WaterProcessor = require("./waterProcessor");
const WaterLogger = require("./waterLogger");

class WaterService {
  static async resetOnlyWaterTable() {
    const connection = connectionDB.promise();

    try {
      console.log("🧹 Resetting ONLY water table...");

      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE water");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("✅ Only water table reset - next ID will be 1");
      return { success: true, message: "Only water table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting water table:", error);
      throw error;
    }
  }

  static async fetchWater(targetCount, maxAttempts) {
    await this.resetOnlyWaterTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    console.log(
      `🎯 Target: ${targetCount} water records, Max attempts: ${maxAttempts}`
    );

    while (attempt <= maxAttempts) {
      WaterLogger.logAttemptStart(attempt, maxAttempts);

      currentCount = await this._getDatabaseCount();
      WaterLogger.logCurrentStatus(currentCount, targetCount);

      attemptsUsed++;
      const result = await WaterProcessor.fetchAndProcessData();

      WaterLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

      if (currentCount >= targetCount) {
        WaterLogger.logTargetReached(targetCount, attemptsUsed);
        break;
      }
    }

    return this._buildFinalResult(targetCount, attemptsUsed, maxAttempts);
  }

  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM water");
    return result[0].total;
  }

  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this._getDatabaseCount();
    const status =
      finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;

    WaterLogger.logFinalResults(
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

module.exports = WaterService;
