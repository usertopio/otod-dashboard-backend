const { getCrops, getCropHarvests } = require("../api/crops");
const { insertOrUpdateCrop } = require("../db/cropsDb");
const { connectionDB } = require("../../config/db/db.conf.js");
const { CROPS_CONFIG, OPERATIONS } = require("../../utils/constants");
const CropsLogger = require("./cropsLogger");

class CropsProcessor {
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

    // 🔧 Fetch data from GetCropHarvests API (single call, no pagination)
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

    return this._buildResult(metrics, dbCountBefore, dbCountAfter);
  }

  // 🔧 Fetch from GetCrops API (paginated)
  static async _fetchGetCropsPages(metrics) {
    console.log(``);
    console.log("📞 Calling GetCrops API (paginated)...");

    // Use totalRecords from actual API response (4 records in example)
    // But we'll use config for flexibility
    const pages = Math.ceil(
      CROPS_CONFIG.DEFAULT_TOTAL_RECORDS / CROPS_CONFIG.DEFAULT_PAGE_SIZE
    );

    for (let page = 1; page <= pages; page++) {
      const requestBody = {
        cropYear: CROPS_CONFIG.DEFAULT_CROP_YEAR || 2024,
        provinceName: "",
        pageIndex: page,
        pageSize: CROPS_CONFIG.DEFAULT_PAGE_SIZE,
      };

      const customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      const crops = await getCrops(requestBody, customHeaders);
      const cropsCurPage = crops.data || [];
      metrics.allCropsFromGetCrops =
        metrics.allCropsFromGetCrops.concat(cropsCurPage);

      CropsLogger.logPageInfo(page, cropsCurPage, "GetCrops");

      // Stop if no more data
      if (cropsCurPage.length === 0) break;
    }
  }

  // 🔧 Fetch from GetCropHarvests API (single call, no pagination)
  static async _fetchGetCropHarvests(metrics) {
    console.log("📞 Calling GetCropHarvests API (single call)...");

    const requestBody = {
      cropYear: CROPS_CONFIG.DEFAULT_CROP_YEAR || 2024,
      provinceName: "",
      fromDate: "2024-09-01",
      toDate: "2024-12-31",
      pageIndex: 1, // Based on API response example
      pageSize: 500,
    };

    const customHeaders = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    };

    const cropHarvests = await getCropHarvests(requestBody, customHeaders);
    const harvestsCurPage = cropHarvests.data || [];
    metrics.allCropsFromGetCropHarvests = harvestsCurPage;

    CropsLogger.logPageInfo(1, harvestsCurPage, "GetCropHarvests");
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
      const result = await insertOrUpdateCrop(crop);

      const cropId = crop.cropId;

      switch (result.operation) {
        case OPERATIONS.INSERT:
          metrics.insertCount++;
          metrics.newRecIds.push(cropId);
          break;
        case OPERATIONS.UPDATE:
          metrics.updateCount++;
          metrics.updatedRecIds.push(cropId);
          break;
        case OPERATIONS.ERROR:
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

module.exports = CropsProcessor;
