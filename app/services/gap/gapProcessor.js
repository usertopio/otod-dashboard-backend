// ===================== Imports =====================
// Import API client for fetching crops (source of GAP data)
import { getCrops } from "../api/crops.js";
import { bulkInsertOrUpdateGap } from "../db/gapDb.js";
import { connectionDB } from "../../config/db/db.conf.js";
import { GAP_CONFIG } from "../../utils/constants.js";
import GapLogger from "./gapLogger.js";

// ===================== Processor =====================
// GapProcessor handles fetching, deduplication, and DB upserts for GAP certificates.
export default class GapProcessor {
  /**
   * 1. Get DB count before processing
   * 2. Fetch all GAP certificate data from API (by year, paginated)
   * 3. Deduplicate records
   * 4. Log summary
   * 5. Bulk upsert to DB
   * 6. Get DB count after processing
   * 7. Return result object
   */
  static async fetchAndProcessData() {
    // 1. Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // 2. Fetch all GAP certificate data from API (by year, paginated)
    const allGap = await this._fetchAllPages();

    // 3. Deduplicate records
    const uniqueGap = this._getUniqueGap(allGap);

    // 4. Log summary
    GapLogger.logApiSummary(allGap.length, uniqueGap.length);

    // 5. Bulk upsert to DB
    const bulkResult = await bulkInsertOrUpdateGap(uniqueGap);

    // 6. Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // 7. Return result object
    return {
      inserted: bulkResult.inserted || 0,
      updated: bulkResult.updated || 0,
      errors: bulkResult.errors || 0,
      totalProcessed: uniqueGap.length,
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      growth: dbCountAfter - dbCountBefore,
      totalFromAPI: allGap.length,
      uniqueFromAPI: uniqueGap.length,
    };
  }

  /**
   * Fetches all GAP certificate data from API (by year, paginated).
   */
  static async _fetchAllPages() {
    let allGap = [];
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
        const cropsCurPage = crops.data || [];
        const gapCertificates = cropsCurPage
          .filter((crop) => crop.gapCertNumber)
          .map((crop) => ({
            recId: crop.recId,
            cropId: crop.cropId,
            gapCertNumber: crop.gapCertNumber,
            gapCertType: crop.gapCertType,
            gapIssuedDate: crop.gapIssuedDate,
            gapExpiryDate: crop.gapExpiryDate,
            farmerId: crop.farmerId,
            province: crop.province,
            amphur: crop.amphur,
            tambon: crop.tambon,
          }));
        allGap = allGap.concat(gapCertificates);
        GapLogger.logPageInfo(year, page, gapCertificates);
        hasMore = cropsCurPage.length === GAP_CONFIG.DEFAULT_PAGE_SIZE;
        page++;
      }
    }
    return allGap;
  }

  /**
   * Deduplicates GAP certificates by recId.
   */
  static _getUniqueGap(allGap) {
    const uniqueMap = new Map();
    for (const gap of allGap) {
      if (gap.recId && !uniqueMap.has(gap.recId)) {
        uniqueMap.set(gap.recId, gap);
      }
    }
    return Array.from(uniqueMap.values());
  }

  /**
   * Gets the current count of GAP certificates in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM gap");
    return result[0].total;
  }
}
