const { connectionDB } = require("../../config/db/db.conf.js");
const { CROPS_CONFIG, STATUS } = require("../../utils/constants");
const CropsProcessor = require("./cropsProcessor");
const CropsLogger = require("./cropsLogger");

class CropsService {
  static async resetOnlyCropsTable() {
    const connection = connectionDB.promise();

    try {
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchCrops`
      );
      console.log("==========================================\n");

      console.log("🧹 Resetting ONLY crops table...");

      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE crops");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("✅ Only crops table reset - next ID will be 1");
      return { success: true, message: "Only crops table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting crops table:", error);
      throw error;
    }
  }

  static async fetchCrops(targetCount, maxAttempts) {
    await this.resetOnlyCropsTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    console.log(
      `🎯 Target: ${targetCount} crops (GetCrops + GetCropHarvests), Max attempts: ${maxAttempts}`
    );

    while (attempt <= maxAttempts) {
      CropsLogger.logAttemptStart(attempt, maxAttempts);

      currentCount = await this._getDatabaseCount();
      CropsLogger.logCurrentStatus(
        currentCount,
        targetCount,
        "crops (from both APIs)"
      );

      attemptsUsed++;
      const result = await CropsProcessor.fetchAndProcessData();

      CropsLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

      if (currentCount >= targetCount) {
        CropsLogger.logTargetReached(targetCount, attemptsUsed);
        break;
      }
    }

    return this._buildFinalResult(targetCount, attemptsUsed, maxAttempts);
  }

  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM crops");
    return result[0].total;
  }

  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this._getDatabaseCount();
    const status =
      finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;

    CropsLogger.logFinalResults(
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
      apis: ["GetCrops", "GetCropHarvests"],
      table: "crops",
    };
  }
}

module.exports = CropsService;
