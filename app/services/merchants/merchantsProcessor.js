// merchantsProcessor.js (ESM)

// ===================== Imports =====================
// Import API client for fetching merchants data
import { getMerchants } from "../api/merchants.js";
// Import DB helper for upserting merchant records
import { bulkInsertOrUpdateMerchants } from "../db/merchantsDb.js";
// Import DB connection for direct queries
import { connectionDB } from "../../config/db/db.conf.js";
// Import config constants and operation enums
import { MERCHANTS_CONFIG, OPERATIONS } from "../../utils/constants.js";
// Import logger for structured process logging
import MerchantsLogger from "./merchantsLogger.js";

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

    // Process all merchants at once
    console.log(
      `🚀 Processing ${uniqueMerchants.length} unique merchants using BULK operations...`
    );

    const bulkResult = await bulkInsertOrUpdateMerchants(uniqueMerchants);

    // Get DB count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // Return simplified result compatible with service
    return {
      inserted: bulkResult.inserted || 0,
      updated: bulkResult.updated || 0,
      errors: bulkResult.errors || 0,
      totalProcessed: uniqueMerchants.length,
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      growth: dbCountAfter - dbCountBefore,
      // Keep for compatibility
      allMerchantsAllPages: metrics.allMerchantsAllPages,
    };
  }

  /**
   * Fetches all pages of merchants from the API and logs each page.
   * @param {object} metrics - Metrics object to accumulate results.
   */
  static async _fetchMerchantsPages(metrics) {
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const requestBody = {
        provinceName: "",
        pageIndex: page,
        pageSize: MERCHANTS_CONFIG.DEFAULT_PAGE_SIZE,
      };

      // const customHeaders = {
      //   Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      // };

      // Fetch a page of merchants from the API
      const merchants = await getMerchants(requestBody);
      const allMerchantsCurPage = merchants.data || [];
      metrics.allMerchantsAllPages =
        metrics.allMerchantsAllPages.concat(allMerchantsCurPage);

      // Log info for this page
      MerchantsLogger.logPageInfo(page, allMerchantsCurPage);

      // Stop if no more data
      if (allMerchantsCurPage.length < MERCHANTS_CONFIG.DEFAULT_PAGE_SIZE) {
        hasMore = false;
      } else {
        page++;
      }
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
   * Gets the current count of merchants in the DB.
   * @returns {Promise<number>} - Total number of merchants.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM merchants");
    return result[0].total;
  }
}

// ===================== Exports =====================
export default MerchantsProcessor;
