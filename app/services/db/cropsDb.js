const {
  connectionDB,
  cropFields,
  cropHarvestFields,
} = require("../../config/db/crops.conf.js");
const { OPERATIONS } = require("../../utils/constants");

// 🔧 KEEP: Legacy functions
const insertCrop = (crop) => {
  const insertCropsQuery = `
          INSERT INTO crops (${cropFields.join(", ")})
          VALUES (${cropFields.map(() => "?").join(", ")})`;

  const values = cropFields.map((cropField) => {
    if (
      (cropField === "gapIssuedDate" ||
        cropField === "gapExpiryDate" ||
        cropField === "cropStartDate" ||
        cropField === "cropEndDate") &&
      crop[cropField] === ""
    ) {
      return null;
    }
    return crop[cropField];
  });

  connectionDB.query(insertCropsQuery, values, (err) => {
    if (err) {
      console.error("Insert error:", err);
    }
  });
};

const insertCropHarvests = (cropHarvest) => {
  const insertCropHarvestsQuery = `
          INSERT INTO crop_harvests (${cropHarvestFields.join(", ")})
          VALUES (${cropHarvestFields.map(() => "?").join(", ")})`;

  const values = cropHarvestFields.map((cropHarvestField) => {
    return cropHarvest[cropHarvestField];
  });

  connectionDB.query(insertCropHarvestsQuery, values, (err) => {
    if (err) {
      console.error("Insert error:", err);
    }
  });
};

// 🔧 NEW: Modern insertOrUpdate function with correct field mappings
async function insertOrUpdateCrop(crop) {
  try {
    // 🔧 Map fields based on actual API responses and database schema
    const values = {
      rec_id: crop.recId || null, // From GetCrops API
      farmer_id: crop.farmerId, // From both APIs
      land_id: crop.landId || "", // From both APIs
      crop_id: crop.cropId, // From both APIs (UNIQUE key)
      crop_year: crop.cropYear || null, // From both APIs
      crop_name: crop.cropName || null, // From GetCrops API
      breed_id: crop.breedId || null, // From GetCrops API
      crop_start_date: crop.cropStartDate || null, // From GetCrops API
      crop_end_date: crop.cropEndDate || null, // From GetCrops API
      total_trees: crop.totalTrees || null, // From GetCrops API
      forecast_kg: crop.forecastKg || null, // From GetCrops API
      forecast_baht: crop.forecastBaht || null, // From GetCrops API
      forecast_worker_cost: crop.forecastWorkerCost || null, // From GetCrops API
      forecast_fertilizer_cost: crop.forecastFertilizerCost || null, // From GetCrops API
      forecast_equipment_cost: crop.forecastEquipmentCost || null, // From GetCrops API
      forecast_petrol_cost: crop.forecastPetrolCost || null, // From GetCrops API
      durian_stage_id: crop.durianStageId || null, // From GetCrops API
      lot_number: crop.lotNumber || null, // From GetCropHarvests API
      created_at: crop.createdTime || null, // From GetCrops API
      updated_at: crop.updatedTime || null, // From GetCrops API
      fetch_at: new Date(), // Current timestamp
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

    // 🔧 Check for existing crop_id (unique key)
    const [existing] = await connectionDB
      .promise()
      .query(`SELECT id FROM crops WHERE crop_id = ? LIMIT 1`, [crop.cropId]);

    if (existing.length > 0) {
      // === Update ===
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
      // === Insert ===
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

module.exports = {
  insertCrop,
  insertCropHarvests,
  insertOrUpdateCrop, // 🔧 NEW: Modern insert/update function
};
