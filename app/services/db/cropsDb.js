// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";

// ===================== DB Utilities =====================
// Provides helper functions for upserting crops

/**
 * Bulk process reference codes for all crops at once
 */
async function bulkProcessReferenceCodes(crops) {
  // Get unique values
  const breeds = [...new Set(crops.map((c) => c.breed).filter(Boolean))];
  const durianStages = [
    ...new Set(crops.map((c) => c.durianStage).filter(Boolean)),
  ];

  // Bulk lookup/create all reference codes
  const [breedCodes, durianStageCodes] = await Promise.all([
    bulkEnsureRefCodes(
      "ref_breeds",
      "breed_name",
      "breed_code",
      breeds,
      "GBREED"
    ),
    bulkEnsureRefCodes(
      "ref_durian_stages",
      "stage_name",
      "stage_code",
      durianStages,
      "GSTAGE"
    ),
  ]);

  return { breedCodes, durianStageCodes };
}

/**
 * Bulk ensure reference codes for a list of names
 */
async function bulkEnsureRefCodes(
  table,
  nameColumn,
  codeColumn,
  names,
  prefix
) {
  if (!names.length) return {};

  // Get existing codes in one query
  const [existing] = await connectionDB
    .promise()
    .query(
      `SELECT ${nameColumn}, ${codeColumn} FROM ${table} WHERE ${nameColumn} IN (?)`,
      [names]
    );

  const codeMap = {};
  existing.forEach((row) => {
    codeMap[row[nameColumn]] = row[codeColumn];
  });

  // Find missing names
  const missingNames = names.filter((name) => !codeMap[name]);

  if (missingNames.length > 0) {
    // Generate codes for missing names
    const [maxResult] = await connectionDB
      .promise()
      .query(
        `SELECT ${codeColumn} FROM ${table} WHERE ${codeColumn} LIKE '${prefix}%' ORDER BY ${codeColumn} DESC LIMIT 1`
      );

    let nextNumber = 1;
    if (maxResult.length > 0) {
      const lastCode = maxResult[0][codeColumn];
      nextNumber = parseInt(lastCode.replace(prefix, "")) + 1;
    }

    // Bulk insert missing codes
    const insertData = missingNames.map((name, index) => {
      const code = `${prefix}${String(nextNumber + index).padStart(3, "0")}`;
      codeMap[name] = code;
      return [code, name, "generated"];
    });

    await connectionDB
      .promise()
      .query(
        `INSERT INTO ${table} (${codeColumn}, ${nameColumn}, source) VALUES ?`,
        [insertData]
      );

    console.log(`🆕 Created ${insertData.length} new ${table} codes`);
  }

  return codeMap;
}

/**
 * Get all existing land_ids from durian_gardens table for validation
 */
async function getValidLandIds() {
  const [results] = await connectionDB
    .promise()
    .query("SELECT DISTINCT land_id FROM durian_gardens");

  return new Set(results.map((row) => row.land_id));
}

/**
 * Bulk insert or update crops using INSERT ... ON DUPLICATE KEY UPDATE
 * @param {Array} crops - Array of crop objects
 * @returns {Promise<object>} - Bulk operation result
 */
export async function bulkInsertOrUpdateCrops(crops) {
  if (!crops || crops.length === 0) {
    return { inserted: 0, updated: 0, errors: 0, skipped: 0 };
  }

  try {
    console.time("⏱️ Reference codes processing");

    // BULK process all reference codes at once
    const { breedCodes, durianStageCodes } = await bulkProcessReferenceCodes(
      crops
    );

    console.timeEnd("⏱️ Reference codes processing");
    console.time("⏱️ Land validation");

    // Get all valid land_ids from durian_gardens
    const validLandIds = await getValidLandIds();

    console.timeEnd("⏱️ Land validation");
    console.time("⏱️ Data preparation");

    // Get current count before operation
    const [countBefore] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM crops");
    const beforeCount = countBefore[0].count;

    // Filter crops with valid land_ids and prepare data
    const validCrops = [];
    const skippedCrops = [];

    for (const crop of crops) {
      // Check if land_id exists in durian_gardens
      if (!validLandIds.has(crop.landId)) {
        skippedCrops.push({
          recId: crop.recId,
          landId: crop.landId,
          reason: "missing_land_reference",
        });
        continue;
      }

      validCrops.push([
        crop.recId, // rec_id
        crop.farmerId, // farmer_id
        crop.landId, // land_id
        crop.cropId, // crop_id
        crop.cropYear || null, // crop_year
        crop.cropName || null, // crop_name
        breedCodes[crop.breed] || crop.breed || null, // breed_id
        crop.cropStartDate || null, // crop_start_date
        crop.cropEndDate || null, // crop_end_date
        crop.totalTrees || null, // total_trees
        crop.forecastKg || null, // forecast_kg
        crop.forecastBaht || null, // forecast_baht
        crop.forecastWorkerCost || null, // forecast_worker_cost
        crop.forecastFertilizerCost || null, // forecast_fertilizer_cost
        crop.forecastEquipmentCost || null, // forecast_equipment_cost
        crop.forecastPetrolCost || null, // forecast_petrol_cost
        durianStageCodes[crop.durianStage] || crop.durianStage || null, // durian_stage_id
        crop.lotNumber || null, // lot_number
        crop.createdTime || null, // created_at
        crop.updatedTime || null, // updated_at
        new Date(), // fetch_at
      ]);
    }

    console.log(
      `📊 Validation: ${validCrops.length} valid, ${skippedCrops.length} skipped crops`
    );

    if (skippedCrops.length > 0) {
      console.warn(
        `⚠️  Skipped ${skippedCrops.length} crops with missing land references`
      );
      // Log first few examples
      skippedCrops.slice(0, 5).forEach((skip) => {
        console.warn(
          `   - Crop ${skip.recId}: land_id '${skip.landId}' not found`
        );
      });
    }

    let actualInserts = 0;
    let actualUpdates = 0;

    if (validCrops.length > 0) {
      console.timeEnd("⏱️ Data preparation");
      console.time("⏱️ Bulk database operation");

      // Execute bulk insert with ON DUPLICATE KEY UPDATE
      const query = `
        INSERT INTO crops (
          rec_id, farmer_id, land_id, crop_id, crop_year, crop_name, breed_id, 
          crop_start_date, crop_end_date, total_trees, forecast_kg, forecast_baht, 
          forecast_worker_cost, forecast_fertilizer_cost, forecast_equipment_cost, 
          forecast_petrol_cost, durian_stage_id, lot_number, created_at, updated_at, fetch_at
        ) VALUES ? 
        ON DUPLICATE KEY UPDATE
          farmer_id = VALUES(farmer_id),
          land_id = VALUES(land_id),
          crop_year = VALUES(crop_year),
          crop_name = VALUES(crop_name),
          breed_id = VALUES(breed_id),
          crop_start_date = VALUES(crop_start_date),
          crop_end_date = VALUES(crop_end_date),
          total_trees = VALUES(total_trees),
          forecast_kg = VALUES(forecast_kg),
          forecast_baht = VALUES(forecast_baht),
          forecast_worker_cost = VALUES(forecast_worker_cost),
          forecast_fertilizer_cost = VALUES(forecast_fertilizer_cost),
          forecast_equipment_cost = VALUES(forecast_equipment_cost),
          forecast_petrol_cost = VALUES(forecast_petrol_cost),
          durian_stage_id = VALUES(durian_stage_id),
          lot_number = VALUES(lot_number),
          updated_at = VALUES(updated_at),
          fetch_at = VALUES(fetch_at)
      `;

      const [result] = await connectionDB.promise().query(query, [validCrops]);

      console.timeEnd("⏱️ Bulk database operation");

      // Get count after operation
      const [countAfter] = await connectionDB
        .promise()
        .query("SELECT COUNT(*) as count FROM crops");
      const afterCount = countAfter[0].count;

      actualInserts = afterCount - beforeCount;
      actualUpdates = validCrops.length - actualInserts;
    } else {
      console.timeEnd("⏱️ Data preparation");
      console.log(
        "⚠️  No valid crops to process - all skipped due to missing land references"
      );
    }

    console.log(
      `📊 Bulk operation: ${actualInserts} inserted, ${actualUpdates} updated, ${skippedCrops.length} skipped`
    );

    return {
      operation: "BULK_UPSERT",
      inserted: actualInserts,
      updated: Math.max(0, actualUpdates),
      errors: 0,
      skipped: skippedCrops.length,
      totalProcessed: crops.length,
      skippedDetails: skippedCrops.slice(0, 10), // First 10 for debugging
    };
  } catch (err) {
    console.error("Bulk crop insert/update error:", err);
    return {
      operation: "BULK_ERROR",
      inserted: 0,
      updated: 0,
      errors: crops.length,
      skipped: 0,
      error: err.message,
    };
  }
}
