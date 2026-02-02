// ===================== Imports =====================
// Import API clients for fetching garden data
import { getLands } from "../api/lands.js";
import { getLandGeoJSON } from "../api/landGeoJSON.js";
// Import DB helper for upserting garden records
import { bulkInsertOrUpdateDurianGardens } from "../db/durianGardensDb.js";
// Import DB connection for direct queries
import { connectionDB } from "../../config/db/db.conf.js";
// Import config constants and operation enums
import { DURIAN_GARDENS_CONFIG } from "../../utils/constants.js";
// Import logger for structured process logging
import DurianGardensLogger from "./durianGardensLogger.js";

// ===================== Processor =====================
// DurianGardensProcessor handles fetching, merging, deduplication, and DB upserts for durian gardens.
export default class DurianGardensProcessor {
  /**
   * Main entry point: fetch, deduplicate, and upsert durian gardens.
   */
  static async fetchAndProcessData() {
    // 1. Get DB count before processing (optional)
    const dbCountBefore = await this._getDatabaseCount();

    // 2. Fetch all gardens from both APIs
    const allGardens = await this._fetchAllPages();

    // 3. Deduplicate gardens (already unique by landId after merge)
    const uniqueGardens = this._getUniqueGardens(allGardens);

    // 4. Log summary
    DurianGardensLogger.logApiSummary(allGardens.length, uniqueGardens.length);

    // 5. Bulk upsert to DB
    const result = await bulkInsertOrUpdateDurianGardens(uniqueGardens);

    // 7. Get DB count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // 8. Return result
    return {
      inserted: result.inserted,
      updated: result.updated,
      errors: result.errors,
      totalAfter: dbCountAfter,
      processingMethod: "BULK_UPSERT",
    };
  }

  /**
   * Fetches all gardens from both APIs and merges them.
   */
  static async _fetchAllPages() {
    // Fetch from GetLands API (paginated)
    let page = 1;
    let allGardensFromGetLands = [];
    let hasMore = true;
    while (hasMore) {
      const requestBody = {
        provinceName: "",
        pageIndex: page,
        pageSize: DURIAN_GARDENS_CONFIG.DEFAULT_PAGE_SIZE,
      };
      const lands = await getLands(requestBody);
      const landsCurPage = lands.data || [];
      allGardensFromGetLands = allGardensFromGetLands.concat(landsCurPage);
      DurianGardensLogger.logPageInfo(1, page, landsCurPage);
      hasMore = landsCurPage.length === DURIAN_GARDENS_CONFIG.DEFAULT_PAGE_SIZE;
      page++;
    }

    // Fetch from GetLandGeoJSON API (single call)
    const requestBodyGeo = {
      province: "",
      amphur: "",
      tambon: "",
      landType: "",
    };
    const landGeoJSON = await getLandGeoJSON(requestBodyGeo);

    // Flatten nested farmers.lands structure
    const flattenedLands = [];
    if (landGeoJSON.farmers && landGeoJSON.farmers.length > 0) {
      landGeoJSON.farmers.forEach((farmer) => {
        if (farmer.lands && farmer.lands.length > 0) {
          farmer.lands.forEach((land) => {
            flattenedLands.push({
              ...land,
              farmer_id: farmer.farmerId,
              farmer_title: farmer.title,
              farmer_firstName: farmer.firstName,
              farmer_lastName: farmer.lastName,
              farmer_province: farmer.province,
              farmer_amphur: farmer.amphur,
              farmer_tambon: farmer.tambon,
            });
          });
        }
      });
    }
    DurianGardensLogger.logPageInfo(1, 1, flattenedLands);

    // Merge records from both APIs by landId
    return this._mergeRecordsFromBothAPIs(
      allGardensFromGetLands,
      flattenedLands
    );
  }

  /**
   * Merges records from both APIs by landId.
   */
  static _mergeRecordsFromBothAPIs(getLandsData, getLandGeoJSONData) {
    const mergedMap = new Map();

    // Add all GetLands records
    getLandsData.forEach((land) => {
      mergedMap.set(land.landId, {
        source: "GetLands",
        recId: land.recId,
        farmerId: land.farmerId,
        landId: land.landId,
        province: land.province,
        amphur: land.amphur,
        tambon: land.tambon,
        title: land.title,
        firstName: land.firstName,
        lastName: land.lastName,
        landType: land.landType,
        lat: land.lat,
        lon: land.lon,
        latDegrees: land.latDegrees,
        latMinutes: land.latMinutes,
        latSeconds: land.latSeconds,
        latDirection: land.latDirection,
        lonDegrees: land.lonDegrees,
        lonMinutes: land.lonMinutes,
        lonSeconds: land.lonSeconds,
        lonDirection: land.lonDirection,
        noOfRais: land.noOfRais,
        noOfNgan: land.noOfNgan,
        noOfWah: land.noOfWah,
        kml: land.kml,
        createdTime: land.createdTime,
        updatedTime: land.updatedTime,
        companyId: land.companyId,
        companyName: land.companyName,
        geojson: null,
      });
    });

    // Merge GetLandGeoJSON data (only geojson field)
    getLandGeoJSONData.forEach((geoLand) => {
      if (mergedMap.has(geoLand.landId)) {
        const existing = mergedMap.get(geoLand.landId);
        existing.geojson = geoLand.geojson;
        existing.source = "Both APIs";
        mergedMap.set(geoLand.landId, existing);
      } else {
        mergedMap.set(geoLand.landId, {
          source: "GetLandGeoJSON",
          recId: null,
          farmerId: geoLand.farmer_id,
          landId: geoLand.landId,
          province: geoLand.farmer_province,
          amphur: geoLand.farmer_amphur,
          tambon: geoLand.farmer_tambon,
          title: geoLand.farmer_title,
          firstName: geoLand.farmer_firstName,
          lastName: geoLand.farmer_lastName,
          landType: geoLand.landType,
          lat: geoLand.lat,
          lon: geoLand.lon,
          latDegrees: null,
          latMinutes: null,
          latSeconds: null,
          latDirection: null,
          lonDegrees: null,
          lonMinutes: null,
          lonSeconds: null,
          lonDirection: null,
          noOfRais: geoLand.noOfRais,
          noOfNgan: geoLand.noOfNgan,
          noOfWah: geoLand.noOfWah,
          kml: null,
          createdTime: null,
          updatedTime: null,
          companyId: null,
          companyName: null,
          geojson: geoLand.geojson,
        });
      }
    });

    return Array.from(mergedMap.values());
  }

  /**
   * Deduplicates gardens (already unique by landId after merge).
   */
  static _getUniqueGardens(allGardens) {
    const uniqueMap = new Map();
    for (const garden of allGardens) {
      if (garden.landId && !uniqueMap.has(garden.landId)) {
        uniqueMap.set(garden.landId, garden);
      }
    }
    return Array.from(uniqueMap.values());
  }

  /**
   * Gets the current count of durian gardens in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM durian_gardens");
    return result[0].total;
  }
}
