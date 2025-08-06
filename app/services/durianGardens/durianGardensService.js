const { connectionDB } = require("../../config/db/db.conf.js");
const { DURIAN_GARDENS_CONFIG, STATUS } = require("../../utils/constants");
const DurianGardensProcessor = require("./durianGardensProcessor");
const DurianGardensLogger = require("./durianGardensLogger");

class DurianGardensService {
  // 🌿 Reset only durian_gardens table (gets data from BOTH APIs) - like farmers
  static async resetOnlyDurianGardensTable() {
    const connection = connectionDB.promise();

    try {
      console.log("🧹 Resetting ONLY durian_gardens table...");

      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE durian_gardens");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("✅ Only durian_gardens table reset - next ID will be 1");
      return { success: true, message: "Only durian_gardens table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting durian_gardens table:", error);
      throw error;
    }
  }

  // 🌿 Single endpoint for BOTH GetLands AND GetLandGeoJSON APIs → durian_gardens table
  static async fetchDurianGardensUntilTarget(targetCount, maxAttempts) {
    // Reset durian_gardens table before fetching
    await this.resetOnlyDurianGardensTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    console.log(
      `🌿 Target: ${targetCount} durian gardens (GetLands + GetLandGeoJSON), Max attempts: ${maxAttempts}`
    );

    // Main processing loop
    while (attempt <= maxAttempts) {
      DurianGardensLogger.logAttemptStart(attempt, maxAttempts);

      // Get current count before this attempt
      currentCount = await this._getDatabaseCount();
      DurianGardensLogger.logCurrentStatus(
        currentCount,
        targetCount,
        "durian gardens (from both APIs)"
      );

      // Always make API call
      attemptsUsed++;
      const result = await DurianGardensProcessor.fetchAndProcessData();

      // Log detailed metrics for this attempt
      DurianGardensLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

      // Stop when target is reached
      if (currentCount >= targetCount) {
        DurianGardensLogger.logTargetReached(targetCount, attemptsUsed);
        break;
      }
    }

    return this._buildFinalResult(targetCount, attemptsUsed, maxAttempts);
  }

  static async _getDatabaseCount() {
    // Count ALL records in durian_gardens table (from both APIs)
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM durian_gardens");
    return result[0].total;
  }

  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this._getDatabaseCount();
    const status =
      finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;

    DurianGardensLogger.logFinalResults(
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
      apis: ["GetLands", "GetLandGeoJSON"],
      table: "durian_gardens",
    };
  }
}

module.exports = DurianGardensService;
