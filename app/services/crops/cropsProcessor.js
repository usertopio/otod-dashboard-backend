// ===================== Imports =====================
// Import API clients for fetching crop data
const { getCrops, getCropHarvests } = require("../api/crops");
// Import DB helper for upserting crop records
const { insertOrUpdateCrop, ensureRefCode } = require("../db/cropsDb");
// Import DB connection for direct queries
const { connectionDB } = require("../../config/db/db.conf.js");
// Import config constants and operation enums
const { CROPS_CONFIG, OPERATIONS } = require("../../utils/constants");
// Import logger for structured process logging
const CropsLogger = require("./cropsLogger");

// ===================== Processor =====================
// CropsProcessor handles fetching, merging, deduplication, and DB upserts for crops.
class CropsProcessor {
  /**
   * Fetches all crop data from both APIs, merges, deduplicates, and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData() {
    // Initialize counters for BOTH APIs
    const metrics = {
      allCropsFromGetCrops: [], // Data from GetCrops API (paginated)
      allCropsFromGetCropHarvests: [], // Data from GetCropHarvests API (single call)
      allCropsAllPages: [], // Combined data from both APIs
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

    // 🔧 Fetch data from GetCrops API (with pagination)
    await this._fetchGetCropsPages(metrics);

    // 🔧 Fetch data from GetCropHarvests API (loop by year and page)
    await this._fetchGetCropHarvests(metrics);

    // 🔧 Combine and merge records from both APIs by cropId
    const mergedCrops = this._mergeRecordsFromBothAPIs(
      metrics.allCropsFromGetCrops,
      metrics.allCropsFromGetCropHarvests
    );

    metrics.allCropsAllPages = mergedCrops;

    // Process unique crops (using cropId as unique identifier)
    const uniqueCrops = this._getUniqueCrops(metrics.allCropsAllPages);
    CropsLogger.logApiSummary(
      metrics.allCropsAllPages.length,
      uniqueCrops.length,
      metrics.allCropsFromGetCrops.length,
      metrics.allCropsFromGetCropHarvests.length
    );

    // Process each unique crop record into crops table
    await this._processUniqueCrops(uniqueCrops, metrics);

    // Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // Build and return a detailed result object
    return this._buildResult(metrics, dbCountBefore, dbCountAfter);
  }

  // 🔧 Fetch from GetCrops API (paginated)
  static async _fetchGetCropsPages(metrics) {
    console.log(``);
    console.log(
      `📞 Sending request to GetCrops API (paginated, by year ${CROPS_CONFIG.START_YEAR}-${CROPS_CONFIG.END_YEAR})...`
    );

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

        // const customHeaders = {
        //   Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        // };

        const crops = await getCrops(requestBody);
        const cropsCurPage = crops.data || [];
        metrics.allCropsFromGetCrops =
          metrics.allCropsFromGetCrops.concat(cropsCurPage);

        // Standardized log
        CropsLogger.logPageInfo(year, page, cropsCurPage);

        if (cropsCurPage.length === 0) hasMore = false;
        page++;
      }
    }
  }

  // 🔧 Fetch from GetCropHarvests API (loop by year and page)
  static async _fetchGetCropHarvests(metrics) {
    console.log(
      `📞 Sending request to GetCropHarvests API (paginated, by year ${CROPS_CONFIG.START_YEAR}-${CROPS_CONFIG.END_YEAR})...`
    );

    let allHarvests = [];
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
          fromDate: `2010-01-01`,
          toDate: `2025-12-31`,
          pageIndex: page,
          pageSize: CROPS_CONFIG.DEFAULT_PAGE_SIZE,
        };

        const customHeaders = {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        };

        const cropHarvests = await getCropHarvests(requestBody, customHeaders);
        const harvestsCurPage = cropHarvests.data || [];
        allHarvests = allHarvests.concat(harvestsCurPage);

        // Standardized log
        CropsLogger.logPageInfo(year, page, harvestsCurPage);

        if (harvestsCurPage.length === 0) hasMore = false;
        page++;
      }
    }
    metrics.allCropsFromGetCropHarvests = allHarvests;
  }

  // 🔧 Merge records from both APIs by cropId
  static _mergeRecordsFromBothAPIs(getCropsData, getCropHarvestsData) {
    console.log(``);
    console.log("🔗 Merging records from both APIs by cropId...");

    // Start with GetCrops data as base (has most fields)
    const mergedMap = new Map();

    // Add all GetCrops records
    getCropsData.forEach((crop) => {
      mergedMap.set(crop.cropId, {
        // 🔧 Map GetCrops fields based on actual API response
        source: "GetCrops",
        recId: crop.recId,
        farmerId: crop.farmerId,
        landId: crop.landId,
        cropId: crop.cropId,
        cropYear: crop.cropYear,
        cropName: crop.cropName,
        breedId: crop.breedId,
        breedName: crop.breedName,
        cropStartDate: crop.cropStartDate,
        cropEndDate: crop.cropEndDate,
        totalTrees: crop.totalTrees,
        forecastKg: crop.forecastKg,
        forecastBaht: crop.forecastBaht,
        forecastWorkerCost: crop.forecastWorkerCost,
        forecastFertilizerCost: crop.forecastFertilizerCost,
        forecastEquipmentCost: crop.forecastEquipmentCost,
        forecastPetrolCost: crop.forecastPetrolCost,
        durianStageId: crop.durianStageId,
        durianStageName: crop.durianStageName,
        gapCertNumber: crop.gapCertNumber,
        gapCertType: crop.gapCertType,
        gapIssuedDate: crop.gapIssuedDate,
        gapExpiryDate: crop.gapExpiryDate,
        createdTime: crop.createdTime,
        updatedTime: crop.updatedTime,
        // Initialize lotNumber as null (will be filled by GetCropHarvests)
        lotNumber: null,
      });
    });

    // Merge GetCropHarvests data (only lotNumber field)
    getCropHarvestsData.forEach((harvest) => {
      if (mergedMap.has(harvest.cropId)) {
        // Update existing record with lotNumber from GetCropHarvests
        const existing = mergedMap.get(harvest.cropId);
        existing.lotNumber = harvest.lotNumber;
        existing.source = "Both APIs";
        mergedMap.set(harvest.cropId, existing);
      } else {
        // Log cropId that exists only in GetCropHarvests
        console.log(
          `🆕 cropId from GetCropHarvests only: ${harvest.cropId} (lotNumber: ${harvest.lotNumber})`
        );
        // Create new record from GetCropHarvests only
        mergedMap.set(harvest.cropId, {
          source: "GetCropHarvests",
          recId: null,
          farmerId: harvest.farmerId,
          landId: harvest.landId,
          cropId: harvest.cropId,
          cropYear: harvest.cropYear,
          cropName: null,
          breedId: null,
          breedName: null,
          cropStartDate: null,
          cropEndDate: null,
          totalTrees: null,
          forecastKg: null,
          forecastBaht: null,
          forecastWorkerCost: null,
          forecastFertilizerCost: null,
          forecastEquipmentCost: null,
          forecastPetrolCost: null,
          durianStageId: null,
          durianStageName: null,
          gapCertNumber: null,
          gapCertType: null,
          gapIssuedDate: null,
          gapExpiryDate: null,
          createdTime: null,
          updatedTime: null,
          lotNumber: harvest.lotNumber, // From GetCropHarvests
        });
      }
    });

    const mergedArray = Array.from(mergedMap.values());
    console.log(`🔗 Merged ${mergedArray.length} unique crops from both APIs`);

    return mergedArray;
  }

  // 🔧 Get unique crops (already unique by cropId from merge)
  static _getUniqueCrops(allCrops) {
    return allCrops; // Already unique from merge process
  }

  // 🔧 Process all unique crops into single crops table
  static async _processUniqueCrops(uniqueCrops, metrics) {
    for (const crop of uniqueCrops) {
      // Ensure breedId is set from reference data (plain number, no prefix)
      const breedId = crop.breedName
        ? await ensureRefCode(
            "ref_breeds",
            "breed_name",
            "breed_id",
            crop.breedName,
            "" // plain numbers
          )
        : null;

      // Ensure durianStageId is set from reference data (plain number, no prefix)
      const durianStageId = crop.durianStageName
        ? await ensureRefCode(
            "ref_durian_stages",
            "stage_name_th",
            "stage_id",
            crop.durianStageName,
            "" // plain numbers
          )
        : null;

      // Upsert crop record with resolved breedId and durianStageId
      const cropData = { ...crop, breedId, durianStageId };
      const result = await insertOrUpdateCrop(cropData);

      const cropId = crop.cropId;

      switch (result.operation) {
        case "INSERT":
          metrics.insertCount++;
          metrics.newRecIds.push(cropId);
          break;
        case "UPDATE":
          metrics.updateCount++;
          metrics.updatedRecIds.push(cropId);
          break;
        case "ERROR":
          metrics.errorCount++;
          metrics.errorRecIds.push(cropId);
          break;
      }

      metrics.processedRecIds.add(cropId);
    }
  }

  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM crops");
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
      totalFromAPI: metrics.allCropsAllPages.length,
      totalFromGetCrops: metrics.allCropsFromGetCrops.length,
      totalFromGetCropHarvests: metrics.allCropsFromGetCropHarvests.length,
      uniqueFromAPI: metrics.allCropsAllPages.length, // Already unique from merge
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
        getCrops: metrics.allCropsFromGetCrops.length,
        getCropHarvests: metrics.allCropsFromGetCropHarvests.length,
        merged: metrics.allCropsAllPages.length,
      },

      // For compatibility
      allCropsAllPages: metrics.allCropsAllPages,
    };
  }
}

// ===================== Exports =====================
module.exports = CropsProcessor;
