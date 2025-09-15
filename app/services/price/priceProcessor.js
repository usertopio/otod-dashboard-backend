// ===================== Imports =====================
import { getAvgPriceByDate } from "../api/price.js";
import { bulkInsertOrUpdateAvgPrice } from "../db/priceDb.js";
import { connectionDB } from "../../config/db/db.conf.js";
import { PRICE_CONFIG } from "../../utils/constants.js";

function addDays(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

// ===================== Processor =====================
// AvgPriceProcessor handles fetching, deduplication, and DB upserts for avg price.
export default class AvgPriceProcessor {
  /**
   * Fetches all avg price data from the API (paginated), deduplicates, and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData() {
    const allPrices = [];
    let startDate = PRICE_CONFIG.FROM_DATE;
    const endDate = PRICE_CONFIG.TO_DATE;

    while (startDate <= endDate) {
      // Calculate chunk end date (max 365 days)
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
        break;
      }

      if (
        apiResult &&
        Array.isArray(apiResult.data) &&
        apiResult.data.length > 0
      ) {
        allPrices.push(...apiResult.data);
      }

      // Move to next chunk
      startDate = addDays(chunkEndDate, 1);
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
