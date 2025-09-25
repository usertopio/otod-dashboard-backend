// ===================== Imports =====================
// Import API clients for fetching crop data
import { getCrops, getCropHarvests } from "../api/crops.js";
// Import DB helper for upserting crop records
import { bulkInsertOrUpdateCrops } from "../db/cropsDb.js";
// Import DB connection for direct queries
import { connectionDB } from "../../config/db/db.conf.js";
// Import config constants and operation enums
import { CROPS_CONFIG } from "../../utils/constants.js";
// Import logger for structured process logging
import CropsLogger from "./cropsLogger.js";

// ===================== Processor =====================
// CropsProcessor handles fetching, merging, deduplication, and DB upserts for crops.
export default class CropsProcessor {
  /**
   * 1. Get DB count before processing
   * 2. Fetch all crop data from both APIs, merge
   * 3. Deduplicate records
   * 4. Log summary
   * 5. Bulk upsert to DB
   * 6. Get DB count after processing
   * 7. Return result object
   */
  static async fetchAndProcessData() {
    // 1. Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // 2. Fetch all crop data from both APIs, merge
    const allCrops = await this._fetchAllPages();

    // 3. Deduplicate records
    const uniqueCrops = this._getUniqueCrops(allCrops);

    // 4. Log summary
    CropsLogger.logApiSummary(allCrops.length, uniqueCrops.length);

    // 5. Bulk upsert to DB
    const bulkResult = await bulkInsertOrUpdateCrops(uniqueCrops);

    // 6. Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // 7. Return result object
    return {
      inserted: bulkResult.inserted || 0,
      updated: bulkResult.updated || 0,
      errors: bulkResult.errors || 0,
      totalProcessed: uniqueCrops.length,
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      growth: dbCountAfter - dbCountBefore,
      totalFromAPI: allCrops.length,
      uniqueFromAPI: uniqueCrops.length,
    };
  }

  /**
   * Fetches all crop data from both APIs and merges them.
   */
  static async _fetchAllPages() {
    // Fetch from GetCrops API (paginated)
    let allCropsFromGetCrops = [];
    for (
      let year = CROPS_CONFIG.START_YEAR;
      year <= CROPS_CONFIG.END_YEAR;
      year++
    ) {
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const requestBody = {
          cropYear: year,
          provinceName: "",
          pageIndex: page,
          pageSize: CROPS_CONFIG.DEFAULT_PAGE_SIZE,
        };
        const crops = await getCrops(requestBody);
        const cropsCurPage = crops.data || [];
        allCropsFromGetCrops = allCropsFromGetCrops.concat(cropsCurPage);
        CropsLogger.logPageInfo(year, page, cropsCurPage);
        hasMore = cropsCurPage.length === CROPS_CONFIG.DEFAULT_PAGE_SIZE;
        page++;
      }
    }

    // Fetch from GetCropHarvests API (by year, paginated)
    let allCropsFromGetCropHarvests = [];
    for (
      let year = CROPS_CONFIG.START_YEAR;
      year <= CROPS_CONFIG.END_YEAR;
      year++
    ) {
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const requestBody = {
          cropYear: year,
          provinceName: "",
          fromDate: "2010-01-01",
          toDate: "2025-12-31",
          pageIndex: page,
          pageSize: CROPS_CONFIG.DEFAULT_PAGE_SIZE,
        };
        const cropHarvests = await getCropHarvests(requestBody);
        const harvestsCurPage = cropHarvests.data || [];
        allCropsFromGetCropHarvests =
          allCropsFromGetCropHarvests.concat(harvestsCurPage);
        CropsLogger.logPageInfo(year, page, harvestsCurPage);
        hasMore = harvestsCurPage.length === CROPS_CONFIG.DEFAULT_PAGE_SIZE;
        page++;
      }
    }

    // Merge records from both APIs by cropId
    return this._mergeRecordsFromBothAPIs(
      allCropsFromGetCrops,
      allCropsFromGetCropHarvests
    );
  }

  /**
   * Merges records from both APIs by cropId.
   */
  static _mergeRecordsFromBothAPIs(getCropsData, getCropHarvestsData) {
    const mergedMap = new Map();
    getCropsData.forEach((crop) => {
      mergedMap.set(crop.cropId, crop);
    });
    getCropHarvestsData.forEach((harvest) => {
      if (!mergedMap.has(harvest.cropId)) {
        mergedMap.set(harvest.cropId, harvest);
      }
    });
    return Array.from(mergedMap.values());
  }

  /**
   * Deduplicates crops by cropId.
   */
  static _getUniqueCrops(allCrops) {
    const uniqueMap = new Map();
    for (const crop of allCrops) {
      if (crop.cropId && !uniqueMap.has(crop.cropId)) {
        uniqueMap.set(crop.cropId, crop);
      }
    }
    return Array.from(uniqueMap.values());
  }

  /**
   * Gets the current count of crops records in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM crops");
    return result[0].total;
  }
}
