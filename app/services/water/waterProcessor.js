// waterProcessor.js (ESM)

// ===================== Imports =====================
// Import API client for fetching water usage summary
import { getWaterUsageSummaryByMonth } from "../api/water.js";
import { bulkInsertOrUpdateWater } from "../db/waterDb.js";
import { connectionDB } from "../../config/db/db.conf.js";
import { WATER_CONFIG, OPERATIONS } from "../../utils/constants.js";
import WaterLogger from "./waterLogger.js";

// ===================== Processor =====================
// WaterProcessor handles fetching, deduplication, and DB upserts for water usage summary.
class WaterProcessor {
  /**
   * Fetches all water usage summary data from the API, deduplicates, and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData() {
    // Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // Initialize metrics
    const metrics = {
      allWaterAllPages: [],
    };

    // Fetch data from API (single call per year)
    await this._fetchWaterSummaryByMonth(metrics);

    // Process unique water records
    const uniqueWater = this._getUniqueWater(metrics.allWaterAllPages);

    WaterLogger.logApiSummary(
      metrics.allWaterAllPages.length,
      uniqueWater.length
    );

    // ✅ BULK PROCESSING: Process all water records at once
    console.log(
      `🚀 Processing ${uniqueWater.length} unique water records using BULK operations...`
    );

    const bulkResult = await bulkInsertOrUpdateWater(uniqueWater);

    // Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // Return simplified result compatible with service
    return {
      inserted: bulkResult.inserted || 0,
      updated: bulkResult.updated || 0,
      errors: bulkResult.errors || 0,
      totalProcessed: uniqueWater.length,
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      growth: dbCountAfter - dbCountBefore,

      // Keep existing properties for compatibility
      allWaterAllPages: metrics.allWaterAllPages,
      uniqueFromAPI: uniqueWater.length,
      totalFromAPI: metrics.allWaterAllPages.length,
    };
  }

  /**
   * Fetches all pages of water usage summary from the API and logs each page.
   * @param {object} metrics - Metrics object to accumulate results.
   */
  static async _fetchWaterSummaryByMonth(metrics) {
    for (
      let year = WATER_CONFIG.START_YEAR;
      year <= WATER_CONFIG.END_YEAR;
      year++
    ) {
      const requestBody = {
        cropYear: year,
        provinceName: "",
      };

      const waterResponse = await getWaterUsageSummaryByMonth(requestBody);
      const allWaterCurPage = waterResponse.data || [];
      metrics.allWaterAllPages =
        metrics.allWaterAllPages.concat(allWaterCurPage);

      WaterLogger.logPageInfo(year, 1, allWaterCurPage);
    }
  }

  /**
   * Deduplicates water records by cropYear, provinceName, and operMonth.
   * @param {Array} allWater - Array of all water records from API.
   * @returns {Array} - Array of unique water records.
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
   * @returns {Promise<number>} - Total number of water records.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM water");
    return result[0].total;
  }
}

// ===================== Exports =====================
export default WaterProcessor;
