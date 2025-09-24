// ===================== Imports =====================
// Import API clients for fetching garden data
import { getLands } from "../api/lands.js";
import { getLandGeoJSON } from "../api/landGeoJSON.js";
// Import DB helper for upserting garden records
import { bulkInsertOrUpdateDurianGardens } from "../db/durianGardensDb.js";
// Import DB connection for direct queries
import { connectionDB } from "../../config/db/db.conf.js";
// Import config constants and operation enums
import { DURIAN_GARDENS_CONFIG, OPERATIONS } from "../../utils/constants.js";
// Import logger for structured process logging
import DurianGardensLogger from "./durianGardensLogger.js";

// ===================== Processor =====================
// DurianGardensProcessor handles fetching, merging, deduplication, and DB upserts for durian gardens.
export default class DurianGardensProcessor {
  /**
   * Fetches all durian garden data from both APIs, merges, deduplicates, and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData() {
    const metrics = {
      allGardensFromGetLands: [],
      allGardensFromGetLandGeoJSON: [],
      allGardensAllPages: [],
    };

    // Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // Fetch from GetLands API (paginated)
    await this._fetchGetLandsPages(metrics);

    // Fetch from GetLandGeoJSON API (single call, no pagination)
    await this._fetchGetLandGeoJSON(metrics);

    const mergedGardens = this._mergeRecordsFromBothAPIs(
      metrics.allGardensFromGetLands,
      metrics.allGardensFromGetLandGeoJSON
    );

    metrics.allGardensAllPages = mergedGardens;

    // Process unique gardens (using landId as unique identifier)
    const uniqueGardens = this._getUniqueGardens(metrics.allGardensAllPages);

    DurianGardensLogger.logApiSummary(
      metrics.allGardensAllPages.length,
      uniqueGardens.length,
      metrics.allGardensFromGetLands.length,
      metrics.allGardensFromGetLandGeoJSON.length
    );

    console.log(
      `🚀 Processing ${uniqueGardens.length} unique durian gardens using BULK operations...`
    );

    // BULK PROCESSING - Single operation for all gardens
    const result = await bulkInsertOrUpdateDurianGardens(uniqueGardens);

    // Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    return {
      inserted: result.inserted,
      updated: result.updated,
      errors: result.errors,
      totalAfter: dbCountAfter,
      processingMethod: "BULK_UPSERT",
    };
  }

  // Fetch from GetLands API (paginated)
  static async _fetchGetLandsPages(metrics) {
    console.log("");
    console.log("📞 Sending request to GetLands API (paginated)...");

    let year = 1; // If you don't have a year loop, keep as 1
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const requestBody = {
        provinceName: "",
        pageIndex: page,
        pageSize: DURIAN_GARDENS_CONFIG.DEFAULT_PAGE_SIZE,
      };

      // const customHeaders = {
      //   Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      // };

      const lands = await getLands(requestBody);
      const landsCurPage = lands.data || [];
      metrics.allGardensFromGetLands =
        metrics.allGardensFromGetLands.concat(landsCurPage);

      // Standardized log
      DurianGardensLogger.logPageInfo(year, page, landsCurPage);

      // Stop if no more data
      if (landsCurPage.length < DURIAN_GARDENS_CONFIG.DEFAULT_PAGE_SIZE) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  // Fetch from GetLandGeoJSON API (single call, no pagination)
  static async _fetchGetLandGeoJSON(metrics) {
    console.log("📞 Sending request to GetLandGeoJSON API (single call)...");

    const requestBody = {
      province: "",
      amphur: "",
      tambon: "",
      landType: "",
    };

    const landGeoJSON = await getLandGeoJSON(requestBody);

    // Transform nested farmers.lands structure to flat array
    const flattenedLands = [];
    if (landGeoJSON.farmers && landGeoJSON.farmers.length > 0) {
      landGeoJSON.farmers.forEach((farmer) => {
        if (farmer.lands && farmer.lands.length > 0) {
          farmer.lands.forEach((land) => {
            flattenedLands.push({
              ...land,
              // Add farmer info to land record
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

    metrics.allGardensFromGetLandGeoJSON = flattenedLands;
    DurianGardensLogger.logPageInfo(1, 1, flattenedLands);
  }

  // Merge records from both APIs by landId
  static _mergeRecordsFromBothAPIs(getLandsData, getLandGeoJSONData) {
    console.log(``);
    console.log("🔗 Merging records from both APIs...");

    // Start with GetLands data as base (has most fields)
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
        // Initialize geojson as null (will be filled by GetLandGeoJSON)
        geojson: null,
      });
    });

    // Merge GetLandGeoJSON data (only geojson field)
    getLandGeoJSONData.forEach((geoLand) => {
      if (mergedMap.has(geoLand.landId)) {
        // Update existing record with geojson from GetLandGeoJSON
        const existing = mergedMap.get(geoLand.landId);
        existing.geojson = geoLand.geojson;
        existing.source = "Both APIs";
        mergedMap.set(geoLand.landId, existing);
      } else {
        // Create new record from GetLandGeoJSON only
        mergedMap.set(geoLand.landId, {
          source: "GetLandGeoJSON",
          recId: null, // No recId from GetLandGeoJSON
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
          geojson: geoLand.geojson, // From GetLandGeoJSON
        });
      }
    });

    const mergedArray = Array.from(mergedMap.values());
    console.log(
      `🔗 Merged ${mergedArray.length} unique gardens from both APIs`
    );

    return mergedArray;
  }

  // Get unique gardens (already unique by landId from merge)
  static _getUniqueGardens(allGardens) {
    return allGardens; // Already unique from merge process
  }

  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM durian_gardens");
    return result[0].total;
  }
}
