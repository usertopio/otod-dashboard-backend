// ===================== Imports =====================
// Import API client for fetching substance usage summary
import { getSubstanceUsageSummaryByMonth } from "../api/substance.js";
import { bulkInsertOrUpdateSubstances } from "../db/substanceDb.js";
import { connectionDB } from "../../config/db/db.conf.js";
import { SUBSTANCE_CONFIG } from "../../utils/constants.js";
import SubstanceLogger from "./substanceLogger.js";

// ===================== Processor =====================
// SubstanceProcessor handles fetching, deduplication, and DB upserts for substance usage summary.
export default class SubstanceProcessor {
  /**
   * 1. Get DB count before processing
   * 2. Fetch all substance usage summary data from API (by year)
   * 3. Deduplicate records
   * 4. Log summary
   * 5. Bulk upsert to DB
   * 6. Get DB count after processing
   * 7. Return result object
   */
  static async fetchAndProcessData() {
    // 1. Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // 2. Fetch all substance usage summary data from API (by year)
    const allSubstance = await this._fetchAllPages();

    // 3. Deduplicate records
    const uniqueSubstance = this._getUniqueSubstance(allSubstance);

    // 4. Log summary
    SubstanceLogger.logApiSummary(allSubstance.length, uniqueSubstance.length);

    // 5. Bulk upsert to DB
    const bulkResult = await bulkInsertOrUpdateSubstances(uniqueSubstance);

    // 6. Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // 7. Return result object
    return {
      inserted: bulkResult.inserted || 0,
      updated: bulkResult.updated || 0,
      errors: bulkResult.errors || 0,
      totalProcessed: uniqueSubstance.length,
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      growth: dbCountAfter - dbCountBefore,
      totalFromAPI: allSubstance.length,
      uniqueFromAPI: uniqueSubstance.length,
    };
  }

  /**
   * Fetches all pages of substance usage summary from the API (by year).
   */
  static async _fetchAllPages() {
    let allSubstance = [];
    for (
      let year = SUBSTANCE_CONFIG.START_YEAR;
      year <= SUBSTANCE_CONFIG.END_YEAR;
      year++
    ) {
      const requestBody = { cropYear: year, provinceName: "" };
      const response = await getSubstanceUsageSummaryByMonth(requestBody);
      const pageData = response.data || [];
      allSubstance = allSubstance.concat(pageData);
      SubstanceLogger.logPageInfo(year, 1, pageData);
    }
    return allSubstance;
  }

  /**
   * Deduplicates substance records by cropYear, provinceName, operMonth, and substance.
   */
  static _getUniqueSubstance(allSubstance) {
    return allSubstance.filter(
      (substance, index, self) =>
        index ===
        self.findIndex(
          (s) =>
            s.cropYear === substance.cropYear &&
            s.provinceName === substance.provinceName &&
            s.operMonth === substance.operMonth &&
            s.substance === substance.substance
        )
    );
  }

  /**
   * Gets the current count of substance records in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM substance");
    return result[0].total;
  }
}
