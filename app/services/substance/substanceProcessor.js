// ===================== Imports =====================
// Import API client for fetching substance usage summary
import { getSubstanceUsageSummaryByMonth } from "../api/substance.js";
import { bulkInsertOrUpdateSubstances } from "../db/substanceDb.js";
import { connectionDB } from "../../config/db/db.conf.js";
import { SUBSTANCE_CONFIG } from "../../utils/constants.js";
import SubstanceLogger from "./substanceLogger.js";

// ===================== Processor =====================
// SubstanceProcessor handles fetching, deduplication, and DB upserts for substance usage summary.
class SubstanceProcessor {
  /**
   * Fetches all substance usage summary data from the API, deduplicates, filters out existing DB records, and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData() {
    // 1. Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // 2. Fetch all substance usage summary data from API (by year)
    const allSubstance = await this._fetchAllPages();

    // 3. Deduplicate records
    const uniqueSubstance = this._getUniqueSubstance(allSubstance);

    // 4. Filter out records that already exist in DB
    const newSubstance = await this._filterExistingRecords(uniqueSubstance);

    // 5. Log summary
    SubstanceLogger.logApiSummary(allSubstance.length, uniqueSubstance.length);

    // 6. Return data for service to handle insert
    return {
      success: true,
      data: newSubstance,
      recordCount: newSubstance.length,
      totalFromAPI: allSubstance.length,
      uniqueFromAPI: uniqueSubstance.length,
      totalBefore: dbCountBefore,
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
   * Filter out records that already exist in the DB.
   * Compares by cropYear, provinceName, substance, operMonth.
   */
  static async _filterExistingRecords(substances) {
    if (!substances.length) return [];

    // Get all existing keys from DB
    const [rows] = await connectionDB
      .promise()
      .query(
        `SELECT crop_year, province, substance, oper_month FROM substance`
      );

    // Normalize DB keys to match API keys
    const existingKeys = new Set(
      rows.map(
        (row) =>
          `${row.crop_year}|${row.province.trim()}|${row.substance.trim()}|${
            row.oper_month ? row.oper_month.toISOString().slice(0, 7) : ""
          }`
      )
    );

    // Normalize API keys to match DB keys
    return substances.filter(
      (item) =>
        !existingKeys.has(
          `${
            item.cropYear
          }|${item.provinceName.trim()}|${item.substance.trim()}|${
            item.operMonth || ""
          }`
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

export default SubstanceProcessor;
