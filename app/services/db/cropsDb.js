// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";

/**
 * Bulk ensure reference codes for a list of names
 */
const bulkEnsureRefCodes = async (
  table,
  nameColumn,
  codeColumn,
  names,
  prefix
) => {
  if (!names.length) return new Map();

  try {
    // Get existing codes in one query
    const [existing] = await connectionDB
      .promise()
      .query(
        `SELECT ${nameColumn}, ${codeColumn} FROM ${table} WHERE ${nameColumn} IN (?)`,
        [names]
      );

    const codeMap = new Map();
    existing.forEach((row) => {
      codeMap.set(row[nameColumn], row[codeColumn]);
    });

    // Find missing names
    const missingNames = names.filter((name) => !codeMap.has(name));

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
        codeMap.set(name, code);
        return [code, name, "generated"];
      });

      const insertQuery = `INSERT INTO ${table} (${codeColumn}, ${nameColumn}, source) VALUES ?`;
      await connectionDB.promise().query(insertQuery, [insertData]);

      console.log(`🆕 Created ${insertData.length} new ${table} codes`);
    }

    return codeMap;
  } catch (err) {
    console.error(`Bulk ${table} lookup error:`, err);
    return new Map();
  }
};

/**
 * Bulk process reference codes for crops
 */
const bulkProcessReferenceCodes = async (crops) => {
  console.time("Reference codes processing");

  try {
    const breeds = [
      ...new Set(crops.map((c) => c.breedName || c.breed).filter(Boolean)),
    ];
    const durianStages = [
      ...new Set(
        crops.map((c) => c.durianStageName || c.durianStage).filter(Boolean)
      ),
    ];

    const [breedCodes, durianStageCodes] = await Promise.all([
      // ✅ FIX: ref_breeds uses breed_name (no _th suffix)
      bulkEnsureRefCodes(
        "ref_breeds",
        "breed_name",
        "breed_id",
        breeds,
        "GBREED"
      ),
      // ✅ FIX: ref_durian_stages uses stage_name_th (with _th suffix)
      bulkEnsureRefCodes(
        "ref_durian_stages",
        "stage_name_th",
        "stage_id",
        durianStages,
        "GSTAGE"
      ),
    ]);

    console.timeEnd("Reference codes processing");
    return { breedCodes, durianStageCodes };
  } catch (error) {
    console.error("❌ Error in bulkProcessReferenceCodes:", error);
    console.timeEnd("Reference codes processing");
    return { breedCodes: new Map(), durianStageCodes: new Map() };
  }
};

/**
 * Validate land ownership for crops
 */
const validateLandOwnership = async (crops) => {
  console.time("Land validation");

  try {
    const connection = connectionDB.promise();

    // Get all unique farmer_id and land_id pairs from crops
    const farmerLandPairs = crops.map((crop) => ({
      farmerId: crop.farmerId,
      landId: crop.landId,
      cropId: crop.cropId,
    }));

    // Get all land records that match our farmer-land pairs
    const farmerIds = [
      ...new Set(farmerLandPairs.map((pair) => pair.farmerId)),
    ];
    const landIds = [...new Set(farmerLandPairs.map((pair) => pair.landId))];

    const [validLands] = await connection.query(
      `SELECT farmer_id, land_id FROM durian_gardens 
       WHERE farmer_id IN (?) AND land_id IN (?)`,
      [farmerIds, landIds]
    );

    // Create a Set of valid farmer-land combinations for fast lookup
    const validCombinations = new Set(
      validLands.map((land) => `${land.farmer_id}-${land.land_id}`)
    );

    // Filter crops to only include those with valid land ownership
    const validCrops = crops.filter((crop) => {
      const key = `${crop.farmerId}-${crop.landId}`;
      return validCombinations.has(key);
    });

    console.timeEnd("Land validation");

    const skippedCount = crops.length - validCrops.length;
    console.log(
      `📊 Validation: ${validCrops.length} valid, ${skippedCount} skipped crops`
    );

    return { validCrops, skippedCount };
  } catch (error) {
    console.error("❌ Error in land validation:", error);
    console.timeEnd("Land validation");
    return { validCrops: [], skippedCount: crops.length };
  }
};

/**
 * Bulk insert or update crops in the database
 */
const bulkInsertOrUpdateCrops = async (crops) => {
  if (!crops || crops.length === 0) {
    return { inserted: 0, updated: 0, errors: 0, skipped: 0 };
  }

  const connection = connectionDB.promise();

  try {
    // Process reference codes
    const { breedCodes, durianStageCodes } = await bulkProcessReferenceCodes(
      crops
    );

    // Validate land ownership
    const { validCrops, skippedCount } = await validateLandOwnership(crops);

    if (validCrops.length === 0) {
      console.log("📊 No valid crops to process after land validation");
      return { inserted: 0, updated: 0, errors: 0, skipped: skippedCount };
    }

    console.time("Data preparation");

    // Prepare data for bulk insert
    const cropData = validCrops.map((crop) => [
      crop.recId, // rec_id
      crop.farmerId, // farmer_id
      crop.landId, // land_id
      crop.cropId, // crop_id
      crop.cropYear || null, // crop_year
      crop.cropName || null, // crop_name
      // ✅ FIX: Use correct API field names for reference codes
      breedCodes.get(crop.breedName || crop.breed) || null, // breed_id
      crop.cropStartDate || null, // crop_start_date
      crop.cropEndDate || null, // crop_end_date
      crop.totalTrees || null, // total_trees
      crop.forecastKg || null, // forecast_kg
      crop.forecastBaht || null, // forecast_baht
      crop.forecastWorkerCost || null, // forecast_worker_cost
      crop.forecastFertilizerCost || null, // forecast_fertilizer_cost
      crop.forecastEquipmentCost || null, // forecast_equipment_cost
      crop.forecastPetrolCost || null, // forecast_petrol_cost
      durianStageCodes.get(crop.durianStageName || crop.durianStage) || null, // durian_stage_id
      crop.lotNumber || null, // lot_number
      crop.createdTime || null, // created_at
      crop.updatedTime || null, // updated_at
    ]);

    console.timeEnd("Data preparation");

    console.time("Bulk database operation");

    // Get count before operation
    const [beforeResult] = await connection.query(
      "SELECT COUNT(*) as count FROM crops"
    );
    const countBefore = beforeResult[0].count;

    // Bulk insert with ON DUPLICATE KEY UPDATE
    const sql = `
      INSERT INTO crops (
        rec_id, farmer_id, land_id, crop_id, crop_year, crop_name, breed_id,
        crop_start_date, crop_end_date, total_trees, forecast_kg, forecast_baht,
        forecast_worker_cost, forecast_fertilizer_cost, forecast_equipment_cost,
        forecast_petrol_cost, durian_stage_id, lot_number, created_at, updated_at,
        fetch_at
      ) VALUES ?
      ON DUPLICATE KEY UPDATE
        farmer_id = VALUES(farmer_id),
        land_id = VALUES(land_id),
        crop_id = VALUES(crop_id),
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
        created_at = VALUES(created_at),
        updated_at = VALUES(updated_at),
        fetch_at = NOW()
    `;

    // Add fetch_at timestamp to each row
    const dataWithTimestamp = cropData.map((row) => [...row, new Date()]);

    const [result] = await connection.query(sql, [dataWithTimestamp]);

    // Get count after operation
    const [afterResult] = await connection.query(
      "SELECT COUNT(*) as count FROM crops"
    );
    const countAfter = afterResult[0].count;

    console.timeEnd("Bulk database operation");

    // Calculate actual inserts and updates
    const actualInserted = countAfter - countBefore;
    const actualUpdated = validCrops.length - actualInserted;

    console.log(
      `📊 Bulk operation: ${actualInserted} inserted, ${actualUpdated} updated, ${skippedCount} skipped`
    );

    return {
      inserted: actualInserted,
      updated: actualUpdated,
      errors: 0,
      skipped: skippedCount,
      affectedRows: result.affectedRows,
      totalProcessed: crops.length,
    };
  } catch (error) {
    console.error("❌ Bulk crop insert/update error:", error);

    return {
      inserted: 0,
      updated: 0,
      errors: crops.length,
      skipped: 0,
      affectedRows: 0,
      totalProcessed: crops.length,
      error: error.message,
    };
  }
};

/**
 * Get the current count of crops in the database
 */
const getCropsCount = async () => {
  try {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM crops");
    return result[0].total;
  } catch (error) {
    console.error("❌ Error getting crops count:", error);
    return 0;
  }
};

/**
 * Reset the crops table
 */
const resetCropsTable = async () => {
  const connection = connectionDB.promise();

  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    await connection.query("TRUNCATE TABLE crops");
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    return { success: true, message: "Crops table reset successfully" };
  } catch (error) {
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    console.error("❌ Error resetting crops table:", error);
    throw error;
  }
};

// Named exports (ESM style)
export {
  bulkInsertOrUpdateCrops,
  getCropsCount,
  resetCropsTable,
  bulkProcessReferenceCodes,
};
