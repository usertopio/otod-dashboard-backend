// ===================== Imports =====================
import { connectionDB } from "../../config/db/db.conf.js";
import { SUBSTANCE_CONFIG, STATUS } from "../../utils/constants.js";
import SubstanceProcessor from "./substanceProcessor.js";
import SubstanceLogger from "./substanceLogger.js";
import { bulkInsertOrUpdateSubstances } from "../db/substanceDb.js";

// ===================== Service =====================
export default class SubstanceService {
  /**
   * Resets only the substance table in the database.
   * - Disables foreign key checks to allow truncation.
   * - Truncates the substance table, leaving related tables untouched.
   * - Re-enables foreign key checks after operation.
   * - Logs the process and returns a status object.
   */
  static async resetOnlySubstanceTable() {
    const connection = connectionDB.promise();

    try {
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchSubstance`
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
  /**
   * Fetches ALL substance from the API and stores it in the database.
   * NEW APPROACH: Fetch first, validate, then truncate.
   * Returns a summary result object.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
  static async fetchAllSubstance(
    maxAttempts = SUBSTANCE_CONFIG.DEFAULT_MAX_ATTEMPTS
  ) {
    console.log("==========================================");
    console.log("📩 NEW APPROACH: Fetch first, validate, then truncate");
    console.log("==========================================\n");

    const countBefore = await this._getDatabaseCount();
    console.log(`📊 Current records in database: ${countBefore}`);

    // STEP 1: Fetch data from API (NO DB changes yet)
    console.log("📡 STEP 1: Fetching data from API...");
    const result = await SubstanceProcessor.fetchAndProcessData();

    // STEP 2: Validate fetch result
    if (!result.success || result.recordCount === 0) {
      console.log("❌ STEP 2: Fetch failed or no data received");
      console.log("⚠️  Table NOT truncated - preserving existing data");
      
      return {
        message: "API fetch failed - table NOT truncated",
        countBefore: countBefore,
        countAfter: countBefore,
        inserted: 0,
        updated: 0,
        errors: 1,
        status: STATUS.FAILED,
        oldDataPreserved: true,
      };
    }

    // STEP 3: Fetch succeeded - NOW safe to truncate
    console.log(`✅ STEP 3: Fetch successful with ${result.recordCount} records`);
    console.log("🧹 STEP 4: NOW safe to reset table...");
    await this.resetOnlySubstanceTable();

    // STEP 5: Insert the new data
    console.log("💾 STEP 5: Inserting new data...");
    const insertResult = await bulkInsertOrUpdateSubstances(result.data);

    const countAfter = await this._getDatabaseCount();

    SubstanceLogger.logFinalResults("ALL", countAfter, 1, maxAttempts, STATUS.SUCCESS);

    return {
      message: "Fetch-first approach succeeded",
      countBefore: countBefore,
      countAfter: countAfter,
      inserted: insertResult.inserted || 0,
      updated: insertResult.updated || 0,
      errors: insertResult.errors || 0,
      status: STATUS.SUCCESS,
      oldDataPreserved: false,
      achieved: countAfter,
      attemptsUsed: 1,
      maxAttempts: maxAttempts,
      reachedTarget: true,
      table: "substance",
    };
  }

  /**
   * Returns the current count of substance records in the database.
   * @returns {Promise<number>} - The total number of substance records in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM substance");
    return result[0].total;
  }

  /**
   * Builds and logs the final result summary after the fetch loop.
   * @param {number} targetCount - The target number of records.
   * @param {number} attemptsUsed - The number of attempts used.
   * @param {number} maxAttempts - The maximum allowed attempts.
   * @returns {object} - Summary of the fetch operation.
   */
  static async _buildFinalResult(targetCount, attemptsUsed, maxAttempts) {
    const finalCount = await this._getDatabaseCount();
    let status;
    // All handle "ALL" target correctly
    if (targetCount === "ALL") {
      status = finalCount > 0 ? STATUS.SUCCESS : STATUS.INCOMPLETE;
    } else {
      status = finalCount >= targetCount ? STATUS.SUCCESS : STATUS.INCOMPLETE;
    }

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
