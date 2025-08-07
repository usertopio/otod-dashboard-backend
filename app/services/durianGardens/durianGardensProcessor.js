// ===================== Imports =====================
// Import API clients for fetching garden data
const { getLands } = require("../api/lands");
const { getLandGeoJSON } = require("../api/landGeoJSON");
// Import DB helper for upserting garden records
const { insertOrUpdateDurianGarden } = require("../db/durianGardensDb");
// Import DB connection for direct queries
const { connectionDB } = require("../../config/db/db.conf.js");
// Import config constants and operation enums
const { DURIAN_GARDENS_CONFIG, OPERATIONS } = require("../../utils/constants");
// Import logger for structured process logging
const DurianGardensLogger = require("./durianGardensLogger");

// ===================== Processor =====================
// DurianGardensProcessor handles fetching, merging, deduplication, and DB upserts for durian gardens.
class DurianGardensProcessor {
  /**
   * Fetches all durian garden data from both APIs, merges, deduplicates, and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData() {
    // Initialize metrics for BOTH APIs
    const metrics = {
      allGardensFromGetLands: [], // Data from GetLands API (paginated)
      allGardensFromGetLandGeoJSON: [], // Data from GetLandGeoJSON API (single call)
      allGardensAllPages: [], // Combined data from both APIs
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

    // Fetch data from GetLands API (with pagination)
    await this._fetchGetLandsPages(metrics);

    // Fetch data from GetLandGeoJSON API (single call, no pagination)
    await this._fetchGetLandGeoJSON(metrics);

    // Combine and merge records from both APIs by landId
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

    // Upsert each unique garden into the DB and update metrics
    await this._processUniqueGardens(uniqueGardens, metrics);

    // Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // Build and return a detailed result object
    return this._buildResult(metrics, dbCountBefore, dbCountAfter);
  }

  // 🌿 Fetch from GetLands API (paginated)
  static async _fetchGetLandsPages(metrics) {
    console.log(``);
    console.log("📞 sending request to GetLands API (paginated)...");

    const pages = Math.ceil(
      DURIAN_GARDENS_CONFIG.DEFAULT_TOTAL_RECORDS /
        DURIAN_GARDENS_CONFIG.DEFAULT_PAGE_SIZE
    );

    for (let page = 1; page <= pages; page++) {
      const requestBody = {
        provinceName: "",
        pageIndex: page,
        pageSize: DURIAN_GARDENS_CONFIG.DEFAULT_PAGE_SIZE,
      };

      const customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      const lands = await getLands(requestBody, customHeaders);
      const landsCurPage = lands.data || [];
      metrics.allGardensFromGetLands =
        metrics.allGardensFromGetLands.concat(landsCurPage);

      DurianGardensLogger.logPageInfo(page, landsCurPage, "GetLands");

      // Stop if no more data
      if (landsCurPage.length === 0) break;
    }
  }

  // 🌿 Fetch from GetLandGeoJSON API (single call, no pagination)
  static async _fetchGetLandGeoJSON(metrics) {
    console.log("📞 sending request to GetLandGeoJSON API (single call)...");

    const requestBody = {
      province: "",
      amphur: "",
      tambon: "",
      landType: "",
    };

    const customHeaders = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    };

    const landGeoJSON = await getLandGeoJSON(requestBody, customHeaders);

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
    DurianGardensLogger.logPageInfo(1, flattenedLands, "GetLandGeoJSON");
  }

  // 🌿 Merge records from both APIs by landId
  static _mergeRecordsFromBothAPIs(getLandsData, getLandGeoJSONData) {
    console.log(``);
    console.log("🔗 Merging records from both APIs...");

    // Start with GetLands data as base (has most fields)
    const mergedMap = new Map();

    // Add all GetLands records
    getLandsData.forEach((land) => {
      mergedMap.set(land.landId, {
        // 🌿 Map GetLands fields based on actual API response
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

  // 🌿 Get unique gardens (already unique by landId from merge)
  static _getUniqueGardens(allGardens) {
    return allGardens; // Already unique from merge process
  }

  // 🌿 Process all unique gardens into single durian_gardens table
  static async _processUniqueGardens(uniqueGardens, metrics) {
    for (const garden of uniqueGardens) {
      const result = await insertOrUpdateDurianGarden(garden);

      const landId = garden.landId;

      switch (result.operation) {
        case OPERATIONS.INSERT:
          metrics.insertCount++;
          metrics.newRecIds.push(landId);
          break;
        case OPERATIONS.UPDATE:
          metrics.updateCount++;
          metrics.updatedRecIds.push(landId);
          break;
        case OPERATIONS.ERROR:
          metrics.errorCount++;
          metrics.errorRecIds.push(landId);
          break;
      }

      metrics.processedRecIds.add(landId);
    }
  }

  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM durian_gardens");
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
      totalFromAPI: metrics.allGardensAllPages.length,
      totalFromGetLands: metrics.allGardensFromGetLands.length,
      totalFromGetLandGeoJSON: metrics.allGardensFromGetLandGeoJSON.length,
      uniqueFromAPI: metrics.allGardensAllPages.length, // Already unique from merge
      duplicatedDataAmount: 0, // No duplicates after merge

      // Record tracking
      newRecIds: metrics.newRecIds,
      updatedRecIds: metrics.updatedRecIds,
      errorRecIds: metrics.errorRecIds,
      processedRecIds: Array.from(metrics.processedRecIds),

      // Additional insights
      recordsInDbNotInAPI: dbCountBefore - metrics.updateCount,
      totalProcessingOperations:
        metrics.insertCount + metrics.updateCount + metrics.errorCount,

      // API breakdown
      apiSources: {
        getLands: metrics.allGardensFromGetLands.length,
        getLandGeoJSON: metrics.allGardensFromGetLandGeoJSON.length,
        merged: metrics.allGardensAllPages.length,
      },

      // For compatibility
      allGardensAllPages: metrics.allGardensAllPages,
    };
  }
}

// ===================== Exports =====================
module.exports = DurianGardensProcessor;
