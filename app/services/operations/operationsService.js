const { connectionDB } = require("../../config/db/db.conf.js");
const { OPERATIONS_CONFIG, STATUS } = require("../../utils/constants");
const OperationsProcessor = require("./operationsProcessor");
const OperationsLogger = require("./operationsLogger");

class OperationsService {
  static async resetOnlyOperationsTable() {
    const connection = connectionDB.promise();

    try {
      console.log("🧹 Resetting ONLY operations table...");

      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE operations");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");

      console.log("✅ Only operations table reset - next ID will be 1");
      return { success: true, message: "Only operations table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting operations table:", error);
      throw error;
    }
  }

  static async fetchOperations(targetCount, maxAttempts) {
    await this.resetOnlyOperationsTable();

    let attempt = 1;
    let currentCount = 0;
    let attemptsUsed = 0;

    console.log(
      `🎯 Target: ${targetCount} operations, Max attempts: ${maxAttempts}`
    );

    while (attempt <= maxAttempts) {
      OperationsLogger.logAttemptStart(attempt, maxAttempts);

      currentCount = await this._getDatabaseCount();
      OperationsLogger.logCurrentStatus(currentCount, targetCount);

      attemptsUsed++;
      const result = await OperationsProcessor.fetchAndProcessData();

      OperationsLogger.logAttemptResults(attempt, result);

      currentCount = result.totalAfter;
      attempt++;

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
