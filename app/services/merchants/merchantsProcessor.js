// ===================== Imports =====================
// Import API client for fetching merchants data
import { getMerchants } from "../api/merchants.js";
// Import DB helper for upserting merchant records
import { bulkInsertOrUpdateMerchants } from "../db/merchantsDb.js";
// Import logger for structured process logging
import MerchantsLogger from "./merchantsLogger.js";

// ===================== Processor =====================
// MerchantsProcessor handles fetching, deduplication, and DB upserts for merchants.
export default class MerchantsProcessor {
  /**
   * Main entry point: fetch, deduplicate, and upsert merchants.
   */
  static async fetchAndProcessData() {
    // 1. Get DB count before processing (optional)
    const dbCountBefore = await this._getDatabaseCount();

    // 2. Fetch all merchants from API (with pagination)
    const allMerchants = await this._fetchAllPages();

    // 3. Deduplicate merchants
    const uniqueMerchants = this._getUniqueMerchants(allMerchants);

    // 4. Log summary (optional)
    MerchantsLogger.logApiSummary(allMerchants.length, uniqueMerchants.length);

    // 5. Bulk upsert to DB
    const result = await bulkInsertOrUpdateMerchants(uniqueMerchants);

    // 6. Return result
    return result;
  }

  /**
   * Fetches all pages of merchants from the API.
   */
  static async _fetchAllPages() {
    let page = 1;
    let allMerchants = [];
    let hasMore = true;
    while (hasMore) {
      const apiResult = await getMerchants({ pageIndex: page, pageSize: 500 });
      if (!apiResult?.data?.length) break;
      allMerchants = allMerchants.concat(apiResult.data);
      page++;
      hasMore = apiResult.data.length === 500;
    }
    return allMerchants;
  }

  /**
   * Deduplicates merchants by recId.
   */
  static _getUniqueMerchants(allMerchants) {
    const uniqueMap = new Map();
    for (const merchant of allMerchants) {
      if (!uniqueMap.has(merchant.recId)) {
        uniqueMap.set(merchant.recId, merchant);
      }
    }
    return Array.from(uniqueMap.values());
  }

  /**
   * Gets the current count of merchants in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await bulkInsertOrUpdateMerchants.connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM merchants");
    return result[0].total;
  }
}
