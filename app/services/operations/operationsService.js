const { connectionDB } = require("../../config/db/db.conf.js");
const { OPERATIONS_CONFIG, STATUS } = require("../../utils/constants");
const OperationsProcessor = require("./operationsProcessor");
const OperationsLogger = require("./operationsLogger");

class OperationsService {
  // 🔧 ADD: Reset only operations table
  static async resetOnlyOperationsTable() {
    const connection = connectionDB.promise();

    try {
      console.log("🧹 Resetting ONLY operations table...");

      // Disable foreign key checks
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");

      // Delete only operations
      await connection.query("TRUNCATE TABLE operations");

      // Re-enable foreign key checks
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("✅ Only operations table reset - next ID will be 1");
      return { success: true, message: "Only operations table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting operations table:", error);
      throw error;
    }
  }

  static async fetchOperationsUntilTarget(targetCount, maxAttempts) {
    // 🔧 ADD: Reset operations table before fetching
    await this.resetOnlyOperationsTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    console.log(
      `🎯 Target: ${targetCount} operations, Max attempts: ${maxAttempts}`
    );

    // Main processing loop
    while (attempt <= maxAttempts) {
      OperationsLogger.logAttemptStart(attempt, maxAttempts);

      // Get current count before this attempt
      currentCount = await this._getDatabaseCount();
      OperationsLogger.logCurrentStatus(currentCount, targetCount);

      // Always make API call
      attemptsUsed++;
      const result = await OperationsProcessor.fetchAndProcessData();

      // Log detailed metrics for this attempt
      OperationsLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

      // Stop when target is reached
      if (currentCount >= targetCount) {
        OperationsLogger.logTargetReached(targetCount, attemptsUsed);
        break;
      }
    }

    return this._buildFinalResult(targetCount, attemptsUsed, maxAttempts);
  }

  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM operations");
    return result[0].total;
  }

  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this._getDatabaseCount();
    const status =
      finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;

    OperationsLogger.logFinalResults(
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

module.exports = OperationsService;
