// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";

// ===================== DB Utilities =====================
// Provides helper functions for upserting crops

/**
 * Ensures a reference code exists in a ref table, creates it if not.
 * For stages, use generatedCodePrefix = "" for plain numbers.
 */
export async function ensureRefCode(
  table,
  nameColumn,
  codeColumn,
  name,
  generatedCodePrefix = ""
) {
  if (!name) return null;

  // Check if name exists
  const [existing] = await connectionDB
    .promise()
    .query(
      `SELECT ${codeColumn} FROM ${table} WHERE ${nameColumn} = ? LIMIT 1`,
      [name]
    );

  if (existing.length > 0) {
    return existing[0][codeColumn];
  } else {
    // Generate next number (plain, no prefix)
    const [maxResult] = await connectionDB
      .promise()
      .query(
        `SELECT MAX(CAST(${codeColumn} AS UNSIGNED)) AS maxId FROM ${table}`
      );

    let newCode;
    if (maxResult.length > 0 && maxResult[0].maxId !== null) {
      newCode = String(Number(maxResult[0].maxId) + 1);
    } else {
      newCode = "1";
    }

    await connectionDB
      .promise()
      .query(
        `INSERT INTO ${table} (${codeColumn}, ${nameColumn}, source) VALUES (?, ?, 'generated')`,
        [newCode, name]
      );

    console.log(`🆕 Created new ${table}: ${newCode} = "${name}"`);
    return newCode;
  }
}

/**
 * Inserts or updates a crop record in the database.
 * Maps reference codes, checks for existence, and upserts accordingly.
 * @param {object} crop - Crop data object.
 * @returns {Promise<object>} - Operation result.
 */
export async function insertOrUpdateCrop(crop) {
  try {
    // Prepare values
    const values = {
      rec_id: crop.recId,
      farmer_id: crop.farmerId,
      land_id: crop.landId,
      crop_id: crop.cropId,
      crop_year: crop.cropYear || null,
      crop_name: crop.cropName || null,
      breed_id: crop.breedId || null,
      crop_start_date: crop.cropStartDate || null,
      crop_end_date: crop.cropEndDate || null,
      total_trees: crop.totalTrees || null,
      forecast_kg: crop.forecastKg || null,
      forecast_baht: crop.forecastBaht || null,
      forecast_worker_cost: crop.forecastWorkerCost || null,
      forecast_fertilizer_cost: crop.forecastFertilizerCost || null,
      forecast_equipment_cost: crop.forecastEquipmentCost || null,
      forecast_petrol_cost: crop.forecastPetrolCost || null,
      durian_stage_id: crop.durianStageId || null,
      lot_number: crop.lotNumber || null,
      created_at: crop.createdTime || null,
      updated_at: crop.updatedTime || null,
      fetch_at: new Date(),
    };

    // Handle date formatting for MySQL
    if (values.crop_start_date === "") values.crop_start_date = null;
    if (values.crop_end_date === "") values.crop_end_date = null;
    if (values.created_at && typeof values.created_at === "string") {
      values.created_at = new Date(values.created_at);
    }
    if (values.updated_at && typeof values.updated_at === "string") {
      values.updated_at = new Date(values.updated_at);
    }

    // Check for existing crop_id (unique key)
    const [existing] = await connectionDB
      .promise()
      .query(`SELECT id FROM crops WHERE crop_id = ? LIMIT 1`, [crop.cropId]);

    if (existing.length > 0) {
      // Direct SQL UPDATE
      await connectionDB.promise().query(
        `UPDATE crops SET 
            rec_id = ?, farmer_id = ?, land_id = ?, crop_year = ?, crop_name = ?, breed_id = ?, 
            crop_start_date = ?, crop_end_date = ?, total_trees = ?, forecast_kg = ?, forecast_baht = ?, 
            forecast_worker_cost = ?, forecast_fertilizer_cost = ?, forecast_equipment_cost = ?, 
            forecast_petrol_cost = ?, durian_stage_id = ?, lot_number = ?, updated_at = ?, fetch_at = ?
           WHERE crop_id = ?`,
        [
          values.rec_id,
          values.farmer_id,
          values.land_id,
          values.crop_year,
          values.crop_name,
          values.breed_id,
          values.crop_start_date,
          values.crop_end_date,
          values.total_trees,
          values.forecast_kg,
          values.forecast_baht,
          values.forecast_worker_cost,
          values.forecast_fertilizer_cost,
          values.forecast_equipment_cost,
          values.forecast_petrol_cost,
          values.durian_stage_id,
          values.lot_number,
          values.updated_at,
          values.fetch_at,
          crop.cropId,
        ]
      );
      return { operation: "UPDATE", recId: crop.cropId };
    } else {
      // Direct SQL INSERT
      await connectionDB.promise().query(
        `INSERT INTO crops 
            (rec_id, farmer_id, land_id, crop_id, crop_year, crop_name, breed_id, crop_start_date, crop_end_date, 
             total_trees, forecast_kg, forecast_baht, forecast_worker_cost, forecast_fertilizer_cost, 
             forecast_equipment_cost, forecast_petrol_cost, durian_stage_id, lot_number, created_at, updated_at, fetch_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          values.rec_id,
          values.farmer_id,
          values.land_id,
          values.crop_id,
          values.crop_year,
          values.crop_name,
          values.breed_id,
          values.crop_start_date,
          values.crop_end_date,
          values.total_trees,
          values.forecast_kg,
          values.forecast_baht,
          values.forecast_worker_cost,
          values.forecast_fertilizer_cost,
          values.forecast_equipment_cost,
          values.forecast_petrol_cost,
          values.durian_stage_id,
          values.lot_number,
          values.created_at,
          values.updated_at,
          values.fetch_at,
        ]
      );
      return { operation: "INSERT", recId: crop.cropId };
    }
  } catch (err) {
    console.error("Crop insert/update error:", err);
    return {
      operation: "ERROR",
      recId: crop.cropId,
      error: err.message,
    };
  }
}
