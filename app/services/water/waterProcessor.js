const { getWaterUsageSummaryByMonth } = require("../api/water");
const { insertOrUpdateWater } = require("../db/waterDb");
const { connectionDB } = require("../../config/db/db.conf.js");
const { WATER_CONFIG, OPERATIONS } = require("../../utils/constants");
const WaterLogger = require("./waterLogger");

class WaterProcessor {
  static async fetchAndProcessData() {
    // Water API doesn't use pagination, so we just make one call
    const pages = 1;

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
    await this._fetchAllPages(pages, metrics);

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

  static async _fetchAllPages(pages, metrics) {
    // Single API call for water data
    const requestBody = {
      cropYear: WATER_CONFIG.DEFAULT_CROP_YEAR || 2024,
      provinceName: "",
    };

    const customHeaders = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    };

    const waterResponse = await getWaterUsageSummaryByMonth(
      requestBody,
      customHeaders
    );
    const allWaterCurPage = waterResponse.data || [];
    metrics.allWaterAllPages = metrics.allWaterAllPages.concat(allWaterCurPage);

    WaterLogger.logPageInfo(1, allWaterCurPage);
  }

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

  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM water");
    return result[0].total;
  }

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

module.exports = WaterProcessor;
