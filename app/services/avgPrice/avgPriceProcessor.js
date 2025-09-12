import { getAvgPriceByDate } from "../api/avgPrice.js";
import { bulkInsertOrUpdateAvgPrice } from "../db/avgPriceDb.js";

class AvgPriceProcessor {
  /**
   * Fetches avg price data from API and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData(requestBody = {}) {
    const metrics = { fetched: 0, upserted: 0, errors: 0 };
    try {
      const apiResult = await getAvgPriceByDate(requestBody);
      if (!apiResult.success || !Array.isArray(apiResult.data)) {
        throw new Error(apiResult.errorMessage || "API returned no data");
      }
      metrics.fetched = apiResult.data.length;
      const dbResult = await bulkInsertOrUpdateAvgPrice(apiResult.data);
      metrics.upserted = dbResult.inserted + dbResult.updated;
      metrics.errors = dbResult.errors;
      return { success: true, metrics, dbResult };
    } catch (err) {
      return { success: false, error: err.message, metrics };
    }
  }
}

export default AvgPriceProcessor;
