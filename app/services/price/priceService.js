// ===================== Imports =====================
import { connectionDB } from "../../config/db/db.conf.js";
import { STATUS } from "../../utils/constants.js";
import AvgPriceProcessor from "./priceProcessor.js";
import AvgPriceLogger from "./priceLogger.js";
import { bulkInsertOrUpdateAvgPrice } from "../db/priceDb.js";

// ===================== Service =====================
// AvgPriceService handles the business logic for fetching, resetting, and managing avg price records.
export default class AvgPriceService {
  /**
   * Resets only the avg_price table in the database.
   * - Disables foreign key checks to allow truncation.
   * - Truncates the avg_price table, leaving related tables untouched.
   * - Re-enables foreign key checks after operation.
   * - Logs the process and returns a status object.
   */
  static async resetOnlyPriceTable() {
    const connection = connectionDB.promise();
    try {
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchAvgPrice`
      );
      console.log("==========================================\n");

      console.log("🧹 Resetting ONLY avg_price table...");

      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("TRUNCATE TABLE avg_price"); // CHANGED
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.log("✅ Only avg_price table reset - next ID will be 1");
      return { success: true, message: "Only avg_price table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting avg_price table:", error);
      throw error;
    }
  }

  /**
   * Fetches ALL avg price records from the API and stores them in the database.
   * NEW APPROACH: Fetch first, validate, then truncate.
   * Returns a summary result object.
   * @param {number} maxAttempts - The maximum number of fetch attempts.
   */
  static async fetchAllAvgPrices(maxAttempts = 10) {
    console.log("==========================================");
    console.log("📩 NEW APPROACH: Fetch first, validate, then truncate");
    console.log("==========================================\n");

    const countBefore = await this._getDatabaseCount();
    console.log(`📊 Current records in database: ${countBefore}`);

    // STEP 1: Fetch data from API (NO DB changes yet)
    console.log("📡 STEP 1: Fetching data from API...");
    const result = await AvgPriceProcessor.fetchAndProcessData();

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
    await this.resetOnlyPriceTable();

    // STEP 5: Insert the new data
    console.log("💾 STEP 5: Inserting new data...");
    const insertResult = await bulkInsertOrUpdateAvgPrice(result.data);

    const countAfter = await this._getDatabaseCount();

    AvgPriceLogger.logFinalResults("ALL", countAfter, 1, maxAttempts, STATUS.SUCCESS);

    return {
      message: "Fetch-first approach succeeded",
      countBefore: countBefore,
      countAfter: countAfter,
      inserted: insertResult.inserted || 0,
      updated: insertResult.updated || 0,
      errors: insertResult.errors || 0,
      status: STATUS.SUCCESS,
      oldDataPreserved: false,
      table: "avg_price",
    };
  }

  /**
   * Returns the current count of avg price records in the database.
   * @returns {Promise<number>} - The total number of avg price records in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM avg_price"); // CHANGED
    return result[0].total;
  }
}
