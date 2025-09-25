// ===================== Imports =====================
// Import API client for fetching farmers data
import { getFarmers } from "../api/farmers.js";
// Import DB helper for bulk upserting farmer records
import { bulkInsertOrUpdateFarmers } from "../db/farmersDb.js";
import { connectionDB } from "../../config/db/db.conf.js";

// ===================== Processor =====================
// FarmersProcessor handles fetching, deduplication, and DB upserts for farmers.
export default class FarmersProcessor {
  /**
   * 1. Get DB count before processing
   * 2. Fetch all farmers data from API (paginated)
   * 3. Deduplicate records
   * 4. Log summary
   * 5. Bulk upsert to DB
   * 6. Get DB count after processing
   * 7. Return result object
   */
  static async fetchAndProcessData() {
    // 1. Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // 2. Fetch all farmers data from API (paginated)
    const allFarmers = await this._fetchAllPages();

    // 3. Deduplicate records
    const uniqueFarmers = this._getUniqueFarmers(allFarmers);

    // 4. Log summary
    console.log(
      `🚀 Processing ${uniqueFarmers.length} unique farmers (from ${allFarmers.length} total API records) using BULK operations...`
    );

    // 5. Bulk upsert to DB
    const bulkResult = await bulkInsertOrUpdateFarmers(uniqueFarmers);

    // 6. Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // 7. Return result object
    return {
      inserted: bulkResult.inserted || 0,
      updated: bulkResult.updated || 0,
      errors: bulkResult.errors || 0,
      totalProcessed: uniqueFarmers.length,
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      growth: dbCountAfter - dbCountBefore,
      totalFromAPI: allFarmers.length,
      uniqueFromAPI: uniqueFarmers.length,
    };
  }

  /**
   * Fetches all farmers data from API (paginated).
   */
  static async _fetchAllPages() {
    let page = 1;
    let allFarmers = [];
    let hasMore = true;
    while (hasMore) {
      console.log(`📄 Fetching page ${page}...`);
      const apiResult = await getFarmers({ pageIndex: page, pageSize: 500 });
      if (!apiResult?.data?.length) break;
      console.log(`   ➡️  Got ${apiResult.data.length} farmers`);
      allFarmers = allFarmers.concat(apiResult.data);
      page++;
      hasMore = apiResult.data.length === 500;
    }
    return allFarmers;
  }

  /**
   * Deduplicates farmers by recId.
   */
  static _getUniqueFarmers(allFarmers) {
    const uniqueMap = new Map();
    for (const farmer of allFarmers) {
      if (farmer.recId && !uniqueMap.has(farmer.recId)) {
        uniqueMap.set(farmer.recId, farmer);
      }
    }
    return Array.from(uniqueMap.values());
  }

  /**
   * Gets the current count of farmers records in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM farmers");
    return result[0].total;
  }
}
