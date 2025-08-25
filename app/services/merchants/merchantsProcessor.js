// ===================== Imports =====================
// Import API client for fetching merchants data
const { getMerchants } = require("../api/merchants");
// Import DB helper for upserting merchant records
const { insertOrUpdateMerchant } = require("../db/merchantsDb");
// Import DB connection for direct queries
const { connectionDB } = require("../../config/db/db.conf.js");
// Import config constants and operation enums
const { MERCHANTS_CONFIG, OPERATIONS } = require("../../utils/constants");
// Import logger for structured process logging
const MerchantsLogger = require("./merchantsLogger");

// ===================== Processor =====================
// MerchantsProcessor handles fetching, deduplication, and DB upserts for merchants.
class MerchantsProcessor {
  /**
   * Fetches all merchant data from the API, deduplicates, and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData() {
    // Initialize metrics for tracking processing
    const metrics = {
      allMerchantsAllPages: [],
      insertCount: 0,
      updateCount: 0,
      errorCount: 0,
      processedRecIds: new Set(),
      newRecIds: [],
      updatedRecIds: [],
      errorRecIds: [],
    };

    // Get DB count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // Fetch all pages from the API and accumulate results
    await this._fetchMerchantsPages(metrics);

    // Deduplicate merchants by recId
    const uniqueMerchants = this._getUniqueMerchants(
      metrics.allMerchantsAllPages
    );
    MerchantsLogger.logApiSummary(
      metrics.allMerchantsAllPages.length,
      uniqueMerchants.length
    );

    // Upsert each unique merchant into the DB and update metrics
    await this._processUniqueMerchants(uniqueMerchants, metrics);

    // Get DB count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // Build and return a detailed result object
    return this._buildResult(metrics, dbCountBefore, dbCountAfter);
  }

  /**
   * Fetches all pages of merchants from the API and logs each page.
   * @param {number} pages - Number of pages to fetch.
   * @param {object} metrics - Metrics object to accumulate results.
   */
  static async _fetchMerchantsPages(metrics) {
    const pages = Math.ceil(
      MERCHANTS_CONFIG.DEFAULT_TOTAL_RECORDS /
        MERCHANTS_CONFIG.DEFAULT_PAGE_SIZE
    );

    for (let page = 1; page <= pages; page++) {
      const requestBody = {
        provinceName: "",
        pageIndex: page,
        pageSize: MERCHANTS_CONFIG.DEFAULT_PAGE_SIZE,
      };

      const customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      // Fetch a page of merchants from the API
      const merchants = await getMerchants(requestBody, customHeaders);
      const allMerchantsCurPage = merchants.data;
      metrics.allMerchantsAllPages =
        metrics.allMerchantsAllPages.concat(allMerchantsCurPage);

      // Log info for this page
      MerchantsLogger.logPageInfo(page, allMerchantsCurPage);
    }
  }

  /**
   * Deduplicates merchants by recId.
   * @param {Array} allMerchants - Array of all merchants from API.
   * @returns {Array} - Array of unique merchants.
   */
  static _getUniqueMerchants(allMerchants) {
    return allMerchants.filter(
      (merchant, index, self) =>
        index === self.findIndex((m) => m.recId === merchant.recId)
    );
  }

  /**
   * Upserts each unique merchant into the DB and updates metrics.
   * @param {Array} uniqueMerchants - Array of unique merchants.
   * @param {object} metrics - Metrics object to update.
   */
  static async _processUniqueMerchants(uniqueMerchants, metrics) {
    for (const merchant of uniqueMerchants) {
      const result = await insertOrUpdateMerchant(merchant);

      switch (result.operation) {
        case OPERATIONS.INSERT:
          metrics.insertCount++;
          metrics.newRecIds.push(merchant.recId);
          break;
        case OPERATIONS.UPDATE:
          metrics.updateCount++;
          metrics.updatedRecIds.push(merchant.recId);
          break;
        case OPERATIONS.ERROR:
          metrics.errorCount++;
          metrics.errorRecIds.push(merchant.recId);
          break;
      }

      metrics.processedRecIds.add(merchant.recId);
    }
  }

  /**
   * Gets the current count of merchants in the DB.
   * @returns {Promise<number>} - Total number of merchants.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM merchants");
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
      totalFromAPI: metrics.allMerchantsAllPages.length,
      uniqueFromAPI: metrics.allMerchantsAllPages.filter(
        (merchant, index, self) =>
          index === self.findIndex((m) => m.recId === merchant.recId)
      ).length,
      duplicatedDataAmount:
        metrics.allMerchantsAllPages.length -
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
      allMerchantsAllPages: metrics.allMerchantsAllPages,
    };
  }
}

// ===================== Exports =====================
module.exports = MerchantsProcessor;
