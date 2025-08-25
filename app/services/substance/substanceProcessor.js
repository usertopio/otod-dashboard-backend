// ===================== Imports =====================
// Import API client for fetching substance usage summary
const { getSubstanceUsageSummaryByMonth } = require("../api/substance");
const { insertOrUpdateSubstance } = require("../db/substanceDb");
const { connectionDB } = require("../../config/db/db.conf.js");
const { SUBSTANCE_CONFIG, OPERATIONS } = require("../../utils/constants");
const SubstanceLogger = require("./substanceLogger");

// ===================== Processor =====================
// SubstanceProcessor handles fetching, deduplication, and DB upserts for substance usage summary.
class SubstanceProcessor {
  /**
   * Fetches all substance usage summary data from the API, deduplicates, and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData() {
    // Substance API doesn't use pagination, so we just make one call
    const pages = 1;

    // Initialize counters
    const metrics = {
      allSubstanceAllPages: [],
      insertCount: 0,
      updateCount: 0,
      errorCount: 0,
      processedRecIds: new Set(),
      newRecIds: [],
      updatedRecIds: [],
      errorRecIds: [],
    };

    // Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // Fetch data from API (single call)
    await this._fetchAllPages(pages, metrics);

    // Process unique substance records
    const uniqueSubstance = this._getUniqueSubstance(
      metrics.allSubstanceAllPages
    );
    SubstanceLogger.logApiSummary(
      metrics.allSubstanceAllPages.length,
      uniqueSubstance.length
    );

    // Process each unique substance record
    await this._processUniqueSubstance(uniqueSubstance, metrics);

    // Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    return this._buildResult(metrics, dbCountBefore, dbCountAfter);
  }

  /**
   * Fetches all pages of substance usage summary from the API and logs each page.
   * @param {number} pages - Number of pages to fetch (always 1).
   * @param {object} metrics - Metrics object to accumulate results.
   */
  static async _fetchAllPages(pages, metrics) {
    for (
      let year = SUBSTANCE_CONFIG.START_YEAR;
      year <= SUBSTANCE_CONFIG.END_YEAR;
      year++
    ) {
      const requestBody = {
        cropYear: year,
        provinceName: "",
      };

      const customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      const substanceResponse = await getSubstanceUsageSummaryByMonth(
        requestBody,
        customHeaders
      );
      const allSubstanceCurPage = substanceResponse.data || [];
      metrics.allSubstanceAllPages =
        metrics.allSubstanceAllPages.concat(allSubstanceCurPage);

      SubstanceLogger.logPageInfo(`Y${year}`, allSubstanceCurPage);
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
   * Upserts each unique substance record into the DB and updates metrics.
   * @param {Array} uniqueSubstance - Array of unique substance records.
   * @param {object} metrics - Metrics object to update.
   */
  static async _processUniqueSubstance(uniqueSubstance, metrics) {
    for (const substance of uniqueSubstance) {
      const result = await insertOrUpdateSubstance(substance);

      // Create unique ID for tracking
      const substanceRecId = `${substance.cropYear}-${substance.provinceName}-${substance.operMonth}-${substance.substance}`;

      switch (result.operation) {
        case OPERATIONS.INSERT:
          metrics.insertCount++;
          metrics.newRecIds.push(substanceRecId);
          break;
        case OPERATIONS.UPDATE:
          metrics.updateCount++;
          metrics.updatedRecIds.push(substanceRecId);
          break;
        case OPERATIONS.ERROR:
          metrics.errorCount++;
          metrics.errorRecIds.push(substanceRecId);
          break;
      }

      metrics.processedRecIds.add(substanceRecId);
    }
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

  /**
   * Builds a detailed result object with metrics and insights.
   * @param {object} metrics - Metrics object.
   * @param {number} dbCountBefore - DB count before processing.
   * @param {number} dbCountAfter - DB count after processing.
   * @returns {object} - Result summary.
   */
  static _buildResult(metrics, dbCountBefore, dbCountAfter) {
    return {
      // Database metrics
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      inserted: metrics.insertCount,
      updated: metrics.updateCount,
      errors: metrics.errorCount,
      growth: dbCountAfter - dbCountBefore,

      // API metrics
      totalFromAPI: metrics.allSubstanceAllPages.length,
      uniqueFromAPI: metrics.allSubstanceAllPages.filter(
        (substance, index, self) =>
          index ===
          self.findIndex(
            (s) =>
              s.cropYear === substance.cropYear &&
              s.provinceName === substance.provinceName &&
              s.operMonth === substance.operMonth &&
              s.substance === substance.substance
          )
      ).length,
      duplicatedDataAmount:
        metrics.allSubstanceAllPages.length -
        metrics.insertCount -
        metrics.updateCount,

      // Record tracking
      newRecIds: metrics.newRecIds,
      updatedRecIds: metrics.updatedRecIds,
      errorRecIds: metrics.errorRecIds,
      processedRecIds: Array.from(metrics.processedRecIds),

      // Additional insights
      recordsInDbNotInAPI: dbCountBefore - metrics.updateCount,
      totalProcessingOperations:
        metrics.insertCount + metrics.updateCount + metrics.errorCount,

      // For compatibility
      allSubstanceAllPages: metrics.allSubstanceAllPages,
    };
  }
}

// ===================== Exports =====================
module.exports = SubstanceProcessor;
