// substanceProcessor.js (ESM)

// ===================== Imports =====================
// Import API client for fetching substance usage summary
import { getSubstanceUsageSummaryByMonth } from "../api/substance.js";
import { bulkInsertOrUpdateSubstances } from "../db/substanceDb.js";
import { connectionDB } from "../../config/db/db.conf.js";
import { SUBSTANCE_CONFIG, OPERATIONS } from "../../utils/constants.js";
import SubstanceLogger from "./substanceLogger.js";

// ===================== Processor =====================
// SubstanceProcessor handles fetching, deduplication, and DB upserts for substance usage summary.
class SubstanceProcessor {
  /**
   * Fetches all substance usage summary data from the API, deduplicates, and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData() {
    // Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // Initialize metrics
    const metrics = {
      allSubstanceAllPages: [],
    };

    // Fetch data from API (single call per year)
    await this._fetchSubstanceByMonth(metrics);

    // Process unique substance records
    const uniqueSubstance = this._getUniqueSubstance(
      metrics.allSubstanceAllPages
    );

    SubstanceLogger.logApiSummary(
      metrics.allSubstanceAllPages.length,
      uniqueSubstance.length
    );

    // Process all substances at once
    console.log(
      `🚀 Processing ${uniqueSubstance.length} unique substances using BULK operations...`
    );

    const bulkResult = await bulkInsertOrUpdateSubstances(uniqueSubstance);

    // Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // Return simplified result compatible with service
    return {
      inserted: bulkResult.inserted || 0,
      updated: bulkResult.updated || 0,
      errors: bulkResult.errors || 0,
      totalProcessed: uniqueSubstance.length,
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      growth: dbCountAfter - dbCountBefore,

      // Keep existing properties for compatibility
      allSubstanceAllPages: metrics.allSubstanceAllPages,
      uniqueFromAPI: uniqueSubstance.length,
      totalFromAPI: metrics.allSubstanceAllPages.length,
    };
  }

  /**
   * Fetches all pages of substance usage summary from the API and logs each page.
   * @param {object} metrics - Metrics object to accumulate results.
   */
  static async _fetchSubstanceByMonth(metrics) {
    for (
      let year = SUBSTANCE_CONFIG.START_YEAR;
      year <= SUBSTANCE_CONFIG.END_YEAR;
      year++
    ) {
      const requestBody = {
        cropYear: year,
        provinceName: "",
      };

      const substanceResponse = await getSubstanceUsageSummaryByMonth(
        requestBody
      );
      const allSubstanceCurPage = substanceResponse.data || [];
      metrics.allSubstanceAllPages =
        metrics.allSubstanceAllPages.concat(allSubstanceCurPage);

      SubstanceLogger.logPageInfo(year, 1, allSubstanceCurPage);
    }
  }

  /**
   * Deduplicates substance records by cropYear, provinceName, operMonth, and substance.
   * @param {Array} allSubstance - Array of all substance records from API.
   * @returns {Array} - Array of unique substance records.
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
   * @returns {Promise<number>} - Total number of substance records.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM substance");
    return result[0].total;
  }
}

export default SubstanceProcessor;
