// ===================== Imports =====================
import { getAvgPriceByDate } from "../api/price.js";
import { bulkInsertOrUpdateAvgPrice } from "../db/priceDb.js";
import { connectionDB } from "../../config/db/db.conf.js";
import { PRICE_CONFIG } from "../../utils/constants.js";

// ===================== Processor =====================
export default class PriceProcessor {
  /**
   * 1. Get DB count before processing
   * 2. Fetch all avg price data from API (by date chunk)
   * 3. Deduplicate records
   * 4. Log summary
   * 5. Bulk upsert to DB
   * 6. Get DB count after processing
   * 7. Return result object
   */
  static async fetchAndProcessData() {
    // 1. Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // 2. Fetch all avg price data from API (by date chunk)
    const allPrices = await this._fetchAllPages();

    // 3. Deduplicate records
    const uniquePrices = this._getUniquePrices(allPrices);

    // 4. Log summary
    // (Optional: implement PriceLogger.logApiSummary if you want logging)
    // PriceLogger.logApiSummary(allPrices.length, uniquePrices.length);

    // 5. Bulk upsert to DB
    const bulkResult = await bulkInsertOrUpdateAvgPrice(uniquePrices);

    // 6. Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // 7. Return result object
    return {
      inserted: bulkResult.inserted || 0,
      updated: bulkResult.updated || 0,
      errors: bulkResult.errors || 0,
      totalProcessed: uniquePrices.length,
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      growth: dbCountAfter - dbCountBefore,
      totalFromAPI: allPrices.length,
      uniqueFromAPI: uniquePrices.length,
    };
  }

  /**
   * Fetches all avg price data from API (by date chunk).
   */
  static async _fetchAllPages() {
    let allPrices = [];
    let startDate = PRICE_CONFIG.FROM_DATE;
    const endDate = PRICE_CONFIG.TO_DATE;

    function addDays(dateStr, days) {
      const date = new Date(dateStr);
      date.setDate(date.getDate() + days);
      return date.toISOString().slice(0, 10);
    }

    while (startDate <= endDate) {
      let chunkEndDate = addDays(startDate, 364);
      if (chunkEndDate > endDate) chunkEndDate = endDate;
      const requestBody = {
        fromDate: startDate,
        toDate: chunkEndDate,
        province: "",
        breedName: "",
      };
      let apiResult;
      try {
        apiResult = await getAvgPriceByDate(requestBody);
      } catch (error) {
        console.error("Avg Price API error:", error);
        startDate = addDays(chunkEndDate, 1);
        continue;
      }
      if (apiResult?.data?.length) {
        allPrices.push(...apiResult.data);
      }
      startDate = addDays(chunkEndDate, 1);
    }
    return allPrices;
  }

  /**
   * Deduplicates avg price records by appPriceId.
   */
  static _getUniquePrices(allPrices) {
    const uniqueMap = new Map();
    for (const price of allPrices) {
      if (price.appPriceId && !uniqueMap.has(price.appPriceId)) {
        uniqueMap.set(price.appPriceId, price);
      }
    }
    return Array.from(uniqueMap.values());
  }

  /**
   * Gets the current count of avg price records in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM price");
    return result[0].total;
  }
}
