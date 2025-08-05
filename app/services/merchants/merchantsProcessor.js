const { getMerchants } = require("../api/merchants");
const { insertOrUpdateMerchant } = require("../db/merchantsDb");
const { connectionDB } = require("../../config/db/db.conf.js");
const { MERCHANTS_CONFIG, OPERATIONS } = require("../../utils/constants");
const MerchantsLogger = require("./merchantsLogger");

class MerchantsProcessor {
  static async fetchAndProcessData() {
    const pages = Math.ceil(
      MERCHANTS_CONFIG.DEFAULT_TOTAL_RECORDS /
        MERCHANTS_CONFIG.DEFAULT_PAGE_SIZE
    );

    // Initialize counters
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

    // Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // Fetch data from all pages
    await this._fetchAllPages(pages, metrics);

    // Process unique merchants
    const uniqueMerchants = this._getUniqueMerchants(
      metrics.allMerchantsAllPages
    );
    MerchantsLogger.logApiSummary(
      metrics.allMerchantsAllPages.length,
      uniqueMerchants.length
    );

    // Process each unique merchant
    await this._processUniqueMerchants(uniqueMerchants, metrics);

    // Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    return this._buildResult(metrics, dbCountBefore, dbCountAfter);
  }

  static async _fetchAllPages(pages, metrics) {
    for (let page = 1; page <= pages; page++) {
      const requestBody = {
        provinceName: "",
        pageIndex: page,
        pageSize: MERCHANTS_CONFIG.DEFAULT_PAGE_SIZE,
      };

      const customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      const merchants = await getMerchants(requestBody, customHeaders);
      const allMerchantsCurPage = merchants.data;
      metrics.allMerchantsAllPages =
        metrics.allMerchantsAllPages.concat(allMerchantsCurPage);

      MerchantsLogger.logPageInfo(page, allMerchantsCurPage);
    }
  }

  static _getUniqueMerchants(allMerchants) {
    return allMerchants.filter(
      (merchant, index, self) =>
        index === self.findIndex((m) => m.recId === merchant.recId)
    );
  }

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

  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM merchants");
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

module.exports = MerchantsProcessor;
