// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";

/**
 * Get Bangkok timezone timestamp as MySQL-compatible string
 */
const getBangkokTime = () => {
  return new Date()
    .toLocaleString("sv-SE", {
      timeZone: "Asia/Bangkok",
    })
    .replace(" ", "T");
};

/**
 * Validates land ownership for crops
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
export async function bulkInsertOrUpdateCrops(crops) {
  if (!crops || crops.length === 0) {
    return { inserted: 0, updated: 0, errors: 0, skipped: 0 };
  }

  const connection = connectionDB.promise();

  try {
    // Validate land ownership
    const { validCrops, skippedCount } = await validateLandOwnership(crops);

    if (validCrops.length === 0) {
      console.log("📊 No valid crops to process after land validation");
      return { inserted: 0, updated: 0, errors: 0, skipped: skippedCount };
    }

    console.time("Data preparation");

    // Get Bangkok time
    const bangkokTime = getBangkokTime();

    // Prepare data for bulk insert
    const cropData = validCrops.map((crop) => [
      crop.recId,
      crop.farmerId,
      crop.landId,
      crop.cropId,
      crop.cropYear ?? null,
      crop.cropName || null,
      crop.breedName || crop.breed || null,
      crop.cropStartDate || null,
      crop.cropEndDate || null,
      crop.totalTrees ?? null,
      crop.forecastKg ?? null,
      crop.forecastBaht ?? null,
      crop.forecastWorkerCost ?? null,
      crop.forecastFertilizerCost ?? null,
      crop.forecastEquipmentCost ?? null,
      crop.forecastPetrolCost ?? null,
      crop.durianStageName || crop.durianStage || null,
      crop.lotNumber || null,
      crop.createdTime || null,
      crop.updatedTime || null,
      bangkokTime,
    ]);

    console.timeEnd("Data preparation");

    console.time("Bulk database operation");

    // Get count before operation
    const [beforeResult] = await connection.query(
      "SELECT COUNT(*) as count FROM crops"
    );
    const countBefore = beforeResult[0].count;

    const sql = `
      INSERT INTO crops (
        rec_id, farmer_id, land_id, crop_id, crop_year, crop_name, breed_name,
        crop_start_date, crop_end_date, total_trees, forecast_kg, forecast_baht,
        forecast_worker_cost, forecast_fertilizer_cost, forecast_equipment_cost,
        forecast_petrol_cost, durian_stage_name, lot_number, created_at, updated_at,
        fetch_at
      ) VALUES ?
      ON DUPLICATE KEY UPDATE
        farmer_id = VALUES(farmer_id),
        land_id = VALUES(land_id),
        crop_id = VALUES(crop_id),
        crop_year = VALUES(crop_year),
        crop_name = VALUES(crop_name),
        breed_name = VALUES(breed_name),
        crop_start_date = VALUES(crop_start_date),
        crop_end_date = VALUES(crop_end_date),
        total_trees = VALUES(total_trees),
        forecast_kg = VALUES(forecast_kg),
        forecast_baht = VALUES(forecast_baht),
        forecast_worker_cost = VALUES(forecast_worker_cost),
        forecast_fertilizer_cost = VALUES(forecast_fertilizer_cost),
        forecast_equipment_cost = VALUES(forecast_equipment_cost),
        forecast_petrol_cost = VALUES(forecast_petrol_cost),
        durian_stage_name = VALUES(durian_stage_name),
        lot_number = VALUES(lot_number),
        created_at = VALUES(created_at),
        updated_at = VALUES(updated_at),
        fetch_at = VALUES(fetch_at)
    `;

    // Use cropData directly
    const [result] = await connection.query(sql, [cropData]);

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
}
