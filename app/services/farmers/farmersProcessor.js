// ===================== Imports =====================
// Import API client for fetching farmers data
const { getFarmers } = require("../api/farmers");
// Import DB helper for upserting farmer records
const { insertOrUpdateFarmer } = require("../db/farmersDb");
// Import DB connection for direct queries
const { connectionDB } = require("../../config/db/db.conf.js");
// Import config constants and operation enums
const { FARMERS_CONFIG, OPERATIONS } = require("../../utils/constants");
// Import logger for structured process logging
const FarmersLogger = require("./farmersLogger");

// ===================== Processor =====================
// FarmersProcessor handles fetching, deduplication, and DB upserts for farmers.
class FarmersProcessor {
  /**
   * Fetches all farmer data from the API, deduplicates, and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData() {
    let page = 1;
    let hasMore = true;
    let allFarmers = [];

    // Fetch all pages and accumulate farmers
    while (hasMore) {
      const apiResult = await this._fetchFarmersPage(page);
      if (!apiResult || apiResult.length === 0) {
        hasMore = false;
        break;
      }
      allFarmers = allFarmers.concat(apiResult);
      page++;
    }

    // Deduplicate across all pages
    const uniqueFarmers = this._getUniqueFarmers(allFarmers);

    let inserted = 0;
    let updated = 0;
    let errors = 0;

    // Upsert each unique farmer
    for (const farmer of uniqueFarmers) {
      const result = await insertOrUpdateFarmer(farmer);
      switch (result.operation) {
        case OPERATIONS.INSERT:
          inserted++;
          break;
        case OPERATIONS.UPDATE:
          updated++;
          break;
        case OPERATIONS.ERROR:
          errors++;
          break;
      }
    }

    // Get DB count after processing
    const dbCountAfter = await this._getDatabaseCount();

    return { inserted, updated, errors, totalAfter: dbCountAfter };
  }

  /**
   * Fetches a single page of farmers from the API.
   * @param {number} page - Page number to fetch.
   * @returns {Promise<Array>} - Array of farmers for the page.
   */
  static async _fetchFarmersPage(page) {
    const requestBody = {
      provinceName: "",
      pageIndex: page,
      pageSize: FARMERS_CONFIG.DEFAULT_PAGE_SIZE,
    };

    // const customHeaders = {
    //   Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    // };

    // Fetch a page of farmers from the API
    const farmers = await getFarmers(requestBody);
    const allFarmersCurPage = farmers.data;

    // Log info for this page
    FarmersLogger.logPageInfo(page, allFarmersCurPage);

    return allFarmersCurPage;
  }

  /**
   * Deduplicates farmers by recId.
   * @param {Array} allFarmers - Array of all farmers from API.
   * @returns {Array} - Array of unique farmers.
   */
  static _getUniqueFarmers(allFarmers) {
    return allFarmers.filter(
      (farmer, index, self) =>
        index === self.findIndex((f) => f.recId === farmer.recId)
    );
  }

  /**
   * Upserts each unique farmer into the DB and updates metrics.
   * @param {Array} uniqueFarmers - Array of unique farmers.
   * @param {object} metrics - Metrics object to update.
   */
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

  /**
   * Gets the current count of farmers in the DB.
   * @returns {Promise<number>} - Total number of farmers.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM farmers");
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

// ===================== Exports =====================
module.exports = FarmersProcessor;
