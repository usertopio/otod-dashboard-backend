// ===================== Imports =====================
// Import API client for fetching water usage summary
import { getWaterUsageSummaryByMonth } from "../api/water.js";
import { bulkInsertOrUpdateWater } from "../db/waterDb.js";
import { connectionDB } from "../../config/db/db.conf.js";
import { WATER_CONFIG } from "../../utils/constants.js";
import WaterLogger from "./waterLogger.js";

// ===================== Processor =====================
// WaterProcessor handles fetching, deduplication, and DB upserts for water usage summary.
export default class WaterProcessor {
  /**
   * 1. Get DB count before processing
   * 2. Fetch all water usage summary data from API (by year)
   * 3. Deduplicate records
   * 4. Log summary
   * 5. Bulk upsert to DB
   * 6. Get DB count after processing
   * 7. Return result object
   */
  static async fetchAndProcessData() {
    // 1. Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // 2. Fetch all water usage summary data from API (by year)
    const allWater = await this._fetchAllPages();

    // 3. Deduplicate records
    const uniqueWater = this._getUniqueWater(allWater);

    // 4. Log summary
    WaterLogger.logApiSummary(allWater.length, uniqueWater.length);

    // 5. Bulk upsert to DB
    const bulkResult = await bulkInsertOrUpdateWater(uniqueWater);

    // 6. Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // 7. Return result object
    return {
      inserted: bulkResult.inserted || 0,
      updated: bulkResult.updated || 0,
      errors: bulkResult.errors || 0,
      totalProcessed: uniqueWater.length,
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      growth: dbCountAfter - dbCountBefore,
      totalFromAPI: allWater.length,
      uniqueFromAPI: uniqueWater.length,
    };
  }

  /**
   * Fetches all pages of water usage summary from the API (by year).
   */
  static async _fetchAllPages() {
    let allWater = [];
    for (
      let year = WATER_CONFIG.START_YEAR;
      year <= WATER_CONFIG.END_YEAR;
      year++
    ) {
      const requestBody = { cropYear: year, provinceName: "" };
      const response = await getWaterUsageSummaryByMonth(requestBody);
      const pageData = response.data || [];
      allWater = allWater.concat(pageData);
      WaterLogger.logPageInfo(year, 1, pageData);
    }
    return allWater;
  }

  /**
   * Deduplicates water records by cropYear, provinceName, and operMonth.
   */
  static _getUniqueWater(allWater) {
    return allWater.filter(
      (water, index, self) =>
        index ===
        self.findIndex(
          (w) =>
            w.cropYear === water.cropYear &&
            w.provinceName === water.provinceName &&
            w.operMonth === water.operMonth
        )
    );
  }

  /**
   * Gets the current count of water records in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM water");
    return result[0].total;
  }
}
