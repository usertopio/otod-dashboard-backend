// ===================== Imports =====================
import { getAvgPriceByDate } from "../api/price.js";
import { bulkInsertOrUpdateAvgPrice } from "../db/priceDb.js";
import { connectionDB } from "../../config/db/db.conf.js";
import { PRICE_CONFIG } from "../../utils/constants.js";

// ===================== Processor =====================
// AvgPriceProcessor handles fetching, deduplication, and DB upserts for avg price.
export default class AvgPriceProcessor {
  /**
   * Fetches all avg price data from the API (paginated), deduplicates, and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData() {
    let page = 1;
    let hasMore = true;
    let allPrices = [];

    // Paginated fetch loop
    while (hasMore) {
      const requestBody = {
        fromDate: PRICE_CONFIG.FROM_DATE,
        toDate: PRICE_CONFIG.TO_DATE,
        province: "",
        breedName: "",
      };

      let apiResult;
      try {
        apiResult = await getAvgPriceByDate(requestBody);
      } catch (error) {
        console.error("Avg Price API error:", error);
        break;
      }

      // Defensive: check for valid response
      if (!apiResult || !apiResult.success || !Array.isArray(apiResult.data)) {
        hasMore = false;
        break;
      }

      const pricesThisPage = apiResult.data;
      if (pricesThisPage.length === 0) {
        hasMore = false;
        break;
      }

      allPrices = allPrices.concat(pricesThisPage);
      page++;
    }

    // Deduplicate by appPriceId
    const uniquePrices = this._getUniquePrices(allPrices);

    // Bulk upsert all unique avg price records
    const dbResult = await bulkInsertOrUpdateAvgPrice(uniquePrices);

    // Get DB count after processing
    const dbCountAfter = await this._getDatabaseCount();

    return {
      inserted: dbResult.inserted,
      updated: dbResult.updated,
      errors: dbResult.errors,
      totalAfter: dbCountAfter,
      processingMethod: "BULK_UPSERT",
      metrics: {
        fetched: uniquePrices.length,
        upserted: dbResult.inserted + dbResult.updated,
        errors: dbResult.errors,
        dbCountAfter,
      },
      success: true,
    };
  }

  /**
   * Deduplicates avg price records by appPriceId.
   * @param {Array} allPrices - Array of all avg price records from API.
   * @returns {Array} - Array of unique avg price records.
   */
  static _getUniquePrices(allPrices) {
    const uniqueMap = new Map();
    for (const price of allPrices) {
      if (!uniqueMap.has(price.appPriceId)) {
        uniqueMap.set(price.appPriceId, price);
      }
    }
    return Array.from(uniqueMap.values());
  }

  /**
   * Gets the current count of avg price records in the DB.
   * @returns {Promise<number>} - Total number of avg price records.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM price");
    return result[0].total;
  }
}
