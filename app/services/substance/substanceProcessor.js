const { getSubstanceUsageSummaryByMonth } = require("../api/substance");
const { insertOrUpdateSubstance } = require("../db/substanceDb");
const { connectionDB } = require("../../config/db/db.conf.js");
const { SUBSTANCE_CONFIG, OPERATIONS } = require("../../utils/constants");
const SubstanceLogger = require("./substanceLogger");

class SubstanceProcessor {
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

  static async _fetchAllPages(pages, metrics) {
    // Single API call for substance data
    const requestBody = {
      cropYear: SUBSTANCE_CONFIG.DEFAULT_CROP_YEAR || 2024,
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

    SubstanceLogger.logPageInfo(1, allSubstanceCurPage);
  }

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

  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM substance");
    return result[0].total;
  }

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

module.exports = SubstanceProcessor;
