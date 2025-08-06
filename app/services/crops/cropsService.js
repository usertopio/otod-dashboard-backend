const { connectionDB } = require("../../config/db/db.conf.js");
const { CROPS_CONFIG, STATUS } = require("../../utils/constants");
const CropsProcessor = require("./cropsProcessor");
const CropsLogger = require("./cropsLogger");

class CropsService {
  // 🔧 Reset only crops table (gets data from BOTH APIs) - like #farmersService.resetOnlyFarmersTable
  static async resetOnlyCropsTable() {
    const connection = connectionDB.promise();

    try {
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

  // 🔧 Single endpoint for BOTH GetCrops AND GetCropHarvests APIs → crops table (like #farmersService.fetchFarmersUntilTarget)
  static async fetchCropsUntilTarget(targetCount, maxAttempts) {
    // Reset crops table before fetching (like #farmersService)
    await this.resetOnlyCropsTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    console.log(
      `🎯 Target: ${targetCount} crops (GetCrops + GetCropHarvests), Max attempts: ${maxAttempts}`
    );

    // Main processing loop (like #farmersService)
    while (attempt <= maxAttempts) {
      CropsLogger.logAttemptStart(attempt, maxAttempts);

      // Get current count before this attempt (like #farmersService)
      currentCount = await this._getDatabaseCount();
      CropsLogger.logCurrentStatus(
        currentCount,
        targetCount,
        "crops (from both APIs)"
      );

      // Always make API call (like #farmersService)
      attemptsUsed++;
      const result = await CropsProcessor.fetchAndProcessData();

      // Log detailed metrics for this attempt (like #farmersService)
      CropsLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

      // Stop when target is reached (like #farmersService)
      if (currentCount >= targetCount) {
        CropsLogger.logTargetReached(targetCount, attemptsUsed);
        break;
      }
    }

    return this._buildFinalResult(targetCount, attemptsUsed, maxAttempts);
  }

  static async _getDatabaseCount() {
    // Count ALL records in crops table (from both APIs) - like #farmersService._getDatabaseCount
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM crops");
    return result[0].total;
  }

  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    // Like #farmersService._buildFinalResult
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
