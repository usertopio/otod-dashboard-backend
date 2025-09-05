// waterProcessor.js (ESM)

// ===================== Imports =====================
// Import API client for fetching water usage summary
import { getWaterUsageSummaryByMonth } from "../api/water.js";
import { insertOrUpdateWater } from "../db/waterDb.js";
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
    // Initialize counters
    const metrics = {
      allWaterAllPages: [],
      insertCount: 0,
      updateCount: 0,
      errorCount: 0,
      processedRecIds: new Set(),
      newRecIds: [],
      updatedRecIds: [],
      errorRecIds: [],
    };

    // Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // Fetch data from API (single call)
    await this._fetchWaterSummaryByMonth(metrics);

    // Process unique water records
    const uniqueWater = this._getUniqueWater(metrics.allWaterAllPages);
    WaterLogger.logApiSummary(
      metrics.allWaterAllPages.length,
      uniqueWater.length
    );

    // Process each unique water record
    await this._processUniqueWater(uniqueWater, metrics);

    // Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    return this._buildResult(metrics, dbCountBefore, dbCountAfter);
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

      // const customHeaders = {
      //   Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      // };

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
   * Upserts each unique water record into the DB and updates metrics.
   * @param {Array} uniqueWater - Array of unique water records.
   * @param {object} metrics - Metrics object to update.
   */
  static async _processUniqueWater(uniqueWater, metrics) {
    for (const water of uniqueWater) {
      const result = await insertOrUpdateWater(water);

      // Create unique ID for tracking
      const waterRecId = `${water.cropYear}-${water.provinceName}-${water.operMonth}`;

      switch (result.operation) {
        case OPERATIONS.INSERT:
          metrics.insertCount++;
          metrics.newRecIds.push(waterRecId);
          break;
        case OPERATIONS.UPDATE:
          metrics.updateCount++;
          metrics.updatedRecIds.push(waterRecId);
          break;
        case OPERATIONS.ERROR:
          metrics.errorCount++;
          metrics.errorRecIds.push(waterRecId);
          break;
      }

      metrics.processedRecIds.add(waterRecId);
    }
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

  /**
   * Builds a detailed result object with metrics and insights.
   * @param {object} metrics - Metrics object.
   * @param {number} dbCountBefore - DB count before processing.
   * @param {number} dbCountAfter - DB count after processing.
   * @returns {object} - Result summary.
   */
  static _buildResult(metrics, dbCountBefore, dbCountAfter) {
    return {
      // Database metrics
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      inserted: metrics.insertCount,
      updated: metrics.updateCount,
      errors: metrics.errorCount,
      growth: dbCountAfter - dbCountBefore,

      // API metrics
      totalFromAPI: metrics.allWaterAllPages.length,
      uniqueFromAPI: metrics.allWaterAllPages.filter(
        (water, index, self) =>
          index ===
          self.findIndex(
            (w) =>
              w.cropYear === water.cropYear &&
              w.provinceName === water.provinceName &&
              w.operMonth === water.operMonth
          )
      ).length,
      duplicatedDataAmount:
        metrics.allWaterAllPages.length -
        metrics.insertCount -
        metrics.updateCount,

      // Record tracking
      newRecIds: metrics.newRecIds,
      updatedRecIds: metrics.updatedRecIds,
      errorRecIds: metrics.errorRecIds,
      processedRecIds: Array.from(metrics.processedRecIds),

      // Additional insights
      recordsInDbNotInAPI: dbCountBefore - metrics.updateCount,
      totalProcessingOperations:
        metrics.insertCount + metrics.updateCount + metrics.errorCount,

      // For compatibility
      allWaterAllPages: metrics.allWaterAllPages,
    };
  }
}

// ===================== Exports =====================
export default WaterProcessor;
