// ===================== Imports =====================
import { connectionDB } from "../../config/db/db.conf.js";
import { FARMERS_CONFIG, STATUS } from "../../utils/constants.js";
import FarmersProcessor from "./farmersProcessor.js";
import FarmersLogger from "./farmersLogger.js";
import { bulkInsertOrUpdateFarmers } from "../db/farmersDb.js";

// ===================== Service =====================
export async function syncFarmersFromApi() {
  console.log("🔄 Starting farmer sync from API...");
  const result = await FarmersProcessor.fetchAndProcessData();
  console.log(
    `✅ Farmer sync complete. Inserted: ${result.inserted}, Updated: ${result.updated}, Errors: ${result.errors}, Total in DB: ${result.totalAfter}`
  );
  return result;
}

export default class FarmersService {
  /**
   * 1. Reset only the farmers table in the database
   * 2. Fetch all farmers from API and store in DB (loop with maxAttempts)
   * 3. Log attempt start/results and final results
   * 4. Return summary result object
   * 5. Get database count method
   */

  // 1. Reset only the farmers table in the database
  static async resetOnlyFarmersTable() {
    const connection = connectionDB.promise();
    try {
      console.log("==========================================");
      console.log(
        `📩 Sending request to API Endpoint: {{LOCAL_HOST}}/api/fetchFarmers`
      );
      console.log("==========================================\n");
      console.log("🧹 Resetting ONLY farmers table...");
      await connection.query("SET FOREIGN_KEY_CHECKS = 0");
      await connection.query("DELETE FROM farmers");
      await connection.query("ALTER TABLE farmers AUTO_INCREMENT = 1");
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.log("✅ Only farmers table reset - next ID will be 1");
      return { success: true, message: "Only farmers table reset" };
    } catch (error) {
      await connection.query("SET FOREIGN_KEY_CHECKS = 1");
      console.error("❌ Error resetting farmers table:", error);
      throw error;
    }
  }

  // 2. Fetch all farmers from API and store in DB (NEW APPROACH: Fetch First)
  // 3. Log attempt start/results and final results
  // 4. Return summary result object
  static async fetchAllFarmers(
    maxAttempts = FARMERS_CONFIG.DEFAULT_MAX_ATTEMPTS
  ) {
    console.log("==========================================");
    console.log(`📩 NEW APPROACH: Fetch first, validate, then truncate`);
    console.log("==========================================\n");

    const countBefore = await this._getDatabaseCount();
    console.log(`📊 Current records in database: ${countBefore}`);

    console.log(`👨‍🌾 Fetching ALL farmers, Max attempts: ${maxAttempts}`);

    let attempt = 1;

    while (attempt <= maxAttempts) {
      FarmersLogger.logAttemptStart(attempt, maxAttempts);

      // STEP 1: Fetch data from API (NO DB changes yet)
      console.log(`📡 STEP 1: Fetching data from API (attempt ${attempt})...`);
      const result = await FarmersProcessor.fetchAndProcessData();

      // STEP 2: Validate fetch result
      if (!result.success || result.recordCount === 0) {
        console.log(`❌ STEP 2: Fetch failed or no data received`);
        console.log(`⚠️  Table NOT truncated - preserving existing data`);
        
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
      console.log(`🧹 STEP 4: NOW safe to reset table...`);
      await this.resetOnlyFarmersTable();

      // STEP 5: Insert the new data
      console.log(`💾 STEP 5: Inserting new data...`);
      const insertResult = await bulkInsertOrUpdateFarmers(result.data);

      const countAfter = await this._getDatabaseCount();

      FarmersLogger.logFinalResults(
        "ALL",
        countAfter,
        attempt,
        maxAttempts,
        STATUS.SUCCESS
      );

      return {
        message: `Fetch-first approach succeeded`,
        countBefore: countBefore,
        countAfter: countAfter,
        inserted: insertResult.inserted || 0,
        updated: insertResult.updated || 0,
        errors: insertResult.errors || 0,
        status: STATUS.SUCCESS,
        oldDataPreserved: false,
        table: "farmers",
      };
    }
  }

  // 5. Get database count method
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM farmers");
    return result[0].total;
  }
}
