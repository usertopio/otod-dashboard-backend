// ===================== Imports =====================
// Import DB connection for executing SQL queries
const { connectionDB } = require("../../config/db/db.conf.js");
const { OPERATIONS } = require("../../utils/constants");

// ===================== DB Utilities =====================
// Provides helper functions for upserting crops

/**
 * Inserts or updates a crop record in the database.
 * Maps reference codes, checks for existence, and upserts accordingly.
 * @param {object} crop - Crop data object.
 * @returns {Promise<object>} - Operation result.
 */
async function insertOrUpdateCrop(crop) {
  try {
    // Prepare values for DB insert/update
    const values = {
      rec_id: crop.recId || null,
      farmer_id: crop.farmerId,
      land_id: crop.landId,
      crop_id: crop.cropId,
      crop_year: crop.cropYear,
      crop_name: crop.cropName || null,
      breed_id: crop.breedId ? String(crop.breedId) : null,
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
      // Update existing record
      const updateFields = Object.keys(values)
        .filter((key) => key !== "crop_id")
        .map((key) => `${key} = ?`)
        .join(", ");

      await connectionDB
        .promise()
        .query(`UPDATE crops SET ${updateFields} WHERE crop_id = ?`, [
          ...Object.values(values).filter(
            (_, i) => Object.keys(values)[i] !== "crop_id"
          ),
          crop.cropId,
        ]);

      return { operation: OPERATIONS.UPDATE, cropId: crop.cropId };
    } else {
      // Insert new record
      await connectionDB.promise().query(
        `INSERT INTO crops (${Object.keys(values).join(
          ", "
        )}) VALUES (${Object.keys(values)
          .map(() => "?")
          .join(", ")})`,
        Object.values(values)
      );

      return { operation: OPERATIONS.INSERT, cropId: crop.cropId };
    }
  } catch (err) {
    console.error("Crop insert/update error:", err);
    return {
      operation: OPERATIONS.ERROR,
      cropId: crop.cropId,
      error: err.message,
    };
  }
}

// ===================== Exports =====================
module.exports = {
  insertOrUpdateCrop,
};
