// gapProcessor.js (ESM)

// ===================== Imports =====================
// Import API client for fetching crops (source of GAP data)
import { getCrops } from "../api/crops.js";
import { bulkInsertOrUpdateGap } from "../db/gapDb.js";
import { connectionDB } from "../../config/db/db.conf.js";
import { GAP_CONFIG } from "../../utils/constants.js";
import GapLogger from "./gapLogger.js";

// ===================== Processor =====================
// GapProcessor handles fetching, deduplication, and DB upserts for GAP certificates.
class GapProcessor {
  /**
   * Fetches all GAP certificate data from the API, deduplicates, and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData() {
    // Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // Initialize metrics
    const metrics = {
      allGapAllPages: [],
    };

    // Fetch data from all pages (extracts GAP certificates from crops)
    await this._fetchGapPages(metrics);

    // Process unique GAP certificates
    const uniqueGap = this._getUniqueGap(metrics.allGapAllPages);

    GapLogger.logApiSummary(metrics.allGapAllPages.length, uniqueGap.length);

    // Process all GAP certificates at once
    console.log(
      `🚀 Processing ${uniqueGap.length} unique GAP certificates using BULK operations...`
    );

    const bulkResult = await bulkInsertOrUpdateGap(uniqueGap);

    // Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // Return simplified result compatible with service
    return {
      inserted: bulkResult.inserted || 0,
      updated: bulkResult.updated || 0,
      errors: bulkResult.errors || 0,
      skipped: bulkResult.skipped || 0,
      totalProcessed: uniqueGap.length,
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      growth: dbCountAfter - dbCountBefore,

      // Keep existing properties for compatibility
      allGapAllPages: metrics.allGapAllPages,
      totalFromAPI: metrics.allGapAllPages.length,
      uniqueFromAPI: uniqueGap.length,
    };
  }

  /**
   * Fetches all pages of crops from the API and extracts GAP certificates.
   * @param {object} metrics - Metrics object to accumulate results.
   */
  static async _fetchGapPages(metrics) {
    for (
      let year = GAP_CONFIG.START_YEAR;
      year <= GAP_CONFIG.END_YEAR;
      year++
    ) {
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const requestBody = {
          cropYear: year,
          provinceName: "",
          pageIndex: page,
          pageSize: GAP_CONFIG.DEFAULT_PAGE_SIZE,
        };

        const crops = await getCrops(requestBody);
        const allCropsCurPage = crops.data || [];

        // Extract gap certificates from crops
        const gapCertificates = this._extractGapCertificates(allCropsCurPage);
        metrics.allGapAllPages = metrics.allGapAllPages.concat(gapCertificates);

        // Standardized log
        GapLogger.logPageInfo(year, page, gapCertificates);

        // Stop if no more data
        if (gapCertificates.length < GAP_CONFIG.DEFAULT_PAGE_SIZE) {
          hasMore = false;
        } else {
          page++;
        }
      }
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
   * Gets the current count of GAP certificates in the DB.
   * @returns {Promise<number>} - Total number of GAP certificates.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM gap");
    return result[0].total;
  }
}
export default GapProcessor;
