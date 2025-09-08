// app/services/farmers/farmersProcessor.js (ESM)

// ===================== Imports =====================
// Import API client for fetching farmers data
import { getFarmers } from "../api/farmers.js";
// Import DB helper for bulk upserting farmer records
import { bulkInsertOrUpdateFarmers } from "../db/farmersDb.js";
// Import DB connection for direct queries
import { connectionDB } from "../../config/db/db.conf.js";
// Import config constants and operation enums
import { FARMERS_CONFIG } from "../../utils/constants.js";
// Import logger for structured process logging
import FarmersLogger from "./farmersLogger.js";

// ===================== Processor =====================
// FarmersProcessor handles fetching, deduplication, and DB upserts for farmers.
export default class FarmersProcessor {
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

    console.log(
      `🚀 Processing ${uniqueFarmers.length} unique farmers using BULK operations...`
    );

    // BULK PROCESSING - Single operation for all farmers
    const result = await bulkInsertOrUpdateFarmers(uniqueFarmers);

    // Get DB count after processing
    const dbCountAfter = await this._getDatabaseCount();

    return {
      inserted: result.inserted,
      updated: result.updated,
      errors: result.errors,
      totalAfter: dbCountAfter,
      processingMethod: "BULK_UPSERT",
    };
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
    const uniqueFarmersMap = new Map();

    for (const farmer of allFarmers) {
      if (!uniqueFarmersMap.has(farmer.recId)) {
        uniqueFarmersMap.set(farmer.recId, farmer);
      }
    }

    return Array.from(uniqueFarmersMap.values());
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
}
