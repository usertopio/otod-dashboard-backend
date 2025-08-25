// ===================== Imports =====================
const { getCrops } = require("../api/crops");
const { insertOrUpdateGap } = require("../db/gapDb");
const { connectionDB } = require("../../config/db/db.conf.js");
const { GAP_CONFIG, OPERATIONS } = require("../../utils/constants");
const GapLogger = require("./gapLogger");

// ===================== Processor =====================
// GapProcessor handles fetching, deduplication, and DB upserts for GAP certificates.
class GapProcessor {
  /**
   * Fetches all GAP certificate data from the API, deduplicates, and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData() {
    const pages = Math.ceil(
      GAP_CONFIG.DEFAULT_TOTAL_RECORDS / GAP_CONFIG.DEFAULT_PAGE_SIZE
    );

    // Initialize counters
    const metrics = {
      allGapAllPages: [],
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

    // Fetch data from all pages
    await this._fetchGapPages(pages, metrics);

    // Process unique gap certificates
    const uniqueGap = this._getUniqueGap(metrics.allGapAllPages);
    GapLogger.logApiSummary(metrics.allGapAllPages.length, uniqueGap.length);

    // Process each unique gap certificate
    await this._processUniqueGap(uniqueGap, metrics);

    // Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    return this._buildResult(metrics, dbCountBefore, dbCountAfter);
  }

  /**
   * Fetches all pages of crops from the API and extracts GAP certificates.
   * @param {number} pages - Number of pages to fetch.
   * @param {object} metrics - Metrics object to accumulate results.
   */
  static async _fetchGapPages(pages, metrics) {
    for (let page = 1; page <= pages; page++) {
      const requestBody = {
        cropYear: GAP_CONFIG.DEFAULT_CROP_YEAR || 2024,
        provinceName: "",
        pageIndex: page,
        pageSize: GAP_CONFIG.DEFAULT_PAGE_SIZE,
      };

      const customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      const crops = await getCrops(requestBody, customHeaders);
      const allCropsCurPage = crops.data;

      // Extract gap certificates from crops
      const gapCertificates = this._extractGapCertificates(allCropsCurPage);
      metrics.allGapAllPages = metrics.allGapAllPages.concat(gapCertificates);

      GapLogger.logPageInfo(page, gapCertificates);
    }
  }

  /**
   * Extracts GAP certificates from crop records.
   * @param {Array} crops - Array of crop records.
   * @returns {Array} - Array of GAP certificate objects.
   */
  static _extractGapCertificates(crops) {
    const gapCertificates = [];

    crops.forEach((crop) => {
      // Only extract crops that have GAP certificate data
      if (crop.gapCertNumber && crop.gapCertNumber.trim() !== "") {
        gapCertificates.push({
          recId: crop.gapCertNumber, // Use gapCertNumber as recId for consistency
          gapCertNumber: crop.gapCertNumber,
          gapCertType: crop.gapCertType,
          gapIssuedDate: crop.gapIssuedDate,
          gapExpiryDate: crop.gapExpiryDate,
          farmerId: crop.farmerId,
          landId: crop.landId,
        });
      }
    });

    return gapCertificates;
  }

  /**
   * Deduplicates GAP certificates by recId.
   * @param {Array} allGap - Array of all GAP certificates from API.
   * @returns {Array} - Array of unique GAP certificates.
   */
  static _getUniqueGap(allGap) {
    return allGap.filter(
      (gap, index, self) =>
        index === self.findIndex((g) => g.recId === gap.recId)
    );
  }

  /**
   * Upserts each unique GAP certificate into the DB and updates metrics.
   * @param {Array} uniqueGap - Array of unique GAP certificates.
   * @param {object} metrics - Metrics object to update.
   */
  static async _processUniqueGap(uniqueGap, metrics) {
    for (const gap of uniqueGap) {
      const result = await insertOrUpdateGap(gap);

      switch (result.operation) {
        case OPERATIONS.INSERT:
          metrics.insertCount++;
          metrics.newRecIds.push(gap.recId);
          break;
        case OPERATIONS.UPDATE:
          metrics.updateCount++;
          metrics.updatedRecIds.push(gap.recId);
          break;
        case OPERATIONS.ERROR:
          metrics.errorCount++;
          metrics.errorRecIds.push(gap.recId);
          break;
      }

      metrics.processedRecIds.add(gap.recId);
    }
  }

  /**
   * Gets the current count of GAP certificates in the DB.
   * @returns {Promise<number>} - Total number of GAP certificates.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM gap");
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
      totalFromAPI: metrics.allGapAllPages.length,
      uniqueFromAPI: metrics.allGapAllPages.filter(
        (gap, index, self) =>
          index === self.findIndex((g) => g.recId === gap.recId)
      ).length,
      duplicatedDataAmount:
        metrics.allGapAllPages.length -
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
      allGapAllPages: metrics.allGapAllPages,
    };
  }
}

// ===================== Exports =====================
module.exports = GapProcessor;
