const { getFarmers } = require("../api/farmers");
const { insertOrUpdateFarmer } = require("../db/farmersDb");
const { connectionDB } = require("../../config/db/db.conf.js");
const { FARMERS_CONFIG, OPERATIONS } = require("../../utils/constants");
const FarmersLogger = require("./farmersLogger");

class FarmersProcessor {
  static async fetchAndProcessData() {
    const pages = Math.ceil(
      FARMERS_CONFIG.DEFAULT_TOTAL_RECORDS / FARMERS_CONFIG.DEFAULT_PAGE_SIZE
    );

    // Initialize counters
    const metrics = {
      allFarmersAllPages: [],
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

    // Fetch data from all pages
    await this._fetchAllPages(pages, metrics);

    // Process unique farmers
    const uniqueFarmers = this._getUniqueFarmers(metrics.allFarmersAllPages);
    FarmersLogger.logApiSummary(
      metrics.allFarmersAllPages.length,
      uniqueFarmers.length
    );

    // Process each unique farmer
    await this._processUniqueFarmers(uniqueFarmers, metrics);

    // Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    return this._buildResult(metrics, dbCountBefore, dbCountAfter);
  }

  static async _fetchAllPages(pages, metrics) {
    for (let page = 1; page <= pages; page++) {
      const requestBody = {
        provinceName: "",
        pageIndex: page,
        pageSize: FARMERS_CONFIG.DEFAULT_PAGE_SIZE,
      };

      const customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      const farmers = await getFarmers(requestBody, customHeaders);
      const allFarmersCurPage = farmers.data;
      metrics.allFarmersAllPages =
        metrics.allFarmersAllPages.concat(allFarmersCurPage);

      FarmersLogger.logPageInfo(page, allFarmersCurPage);
    }
  }

  static _getUniqueFarmers(allFarmers) {
    return allFarmers.filter(
      (farmer, index, self) =>
        index === self.findIndex((f) => f.recId === farmer.recId)
    );
  }

  static async _processUniqueFarmers(uniqueFarmers, metrics) {
    for (const farmer of uniqueFarmers) {
      const result = await insertOrUpdateFarmer(farmer);

      switch (result.operation) {
        case OPERATIONS.INSERT:
          metrics.insertCount++;
          metrics.newRecIds.push(farmer.recId);
          break;
        case OPERATIONS.UPDATE:
          metrics.updateCount++;
          metrics.updatedRecIds.push(farmer.recId);
          break;
        case OPERATIONS.ERROR:
          metrics.errorCount++;
          metrics.errorRecIds.push(farmer.recId);
          break;
      }

      metrics.processedRecIds.add(farmer.recId);
    }
  }

  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM farmers");
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
      totalFromAPI: metrics.allFarmersAllPages.length,
      uniqueFromAPI: metrics.allFarmersAllPages.filter(
        (farmer, index, self) =>
          index === self.findIndex((f) => f.recId === farmer.recId)
      ).length,
      duplicatedDataAmount:
        metrics.allFarmersAllPages.length -
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
      allFarmersAllPages: metrics.allFarmersAllPages,
    };
  }
}

module.exports = FarmersProcessor;
