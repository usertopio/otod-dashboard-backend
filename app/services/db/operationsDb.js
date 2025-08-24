// ===================== Imports =====================
// Import DB connection for executing SQL queries
const { connectionDB } = require("../../config/db/db.conf.js");
const { OPERATIONS } = require("../../utils/constants");
// Add this import:
const { getOrInsertProvince } = require("./locationHelper");

// ===================== DB Utilities =====================
// Provides helper functions for upserting operations

/**
 * Inserts or updates an operation record in the database.
 * Checks for existence, and upserts accordingly.
 * @param {object} operation - Operation data object.
 * @returns {Promise<object>} - Operation result.
 */
const insertOrUpdateOperation = async (operation) => {
  try {
    // === Map province name to code ===
    let provinceCode = null;
    if (operation.province) {
      const province = await getOrInsertProvince(operation.province);
      provinceCode = province ? province.province_code : null;
    }

    // === Prepare values ===
    const values = {
      rec_id: operation.recId,
      operation_province_code: provinceCode,
      crop_year: operation.cropYear || null,
      oper_id: operation.operId,
      crop_id: operation.cropId,
      oper_type: operation.operType || null,
      oper_date: operation.operDate || null,
      no_of_workers: operation.noOfWorkers || null,
      worker_cost: operation.workerCost || null,
      fertilizer_cost: operation.fertilizerCost || null,
      equipment_cost: operation.equipmentCost || null,
      created_at: operation.createdTime || null,
      updated_at: operation.updatedTime || null,
      fetch_at: new Date(),
      company_id: operation.companyId || null,
    };

    // Check if operation already exists
    const [existing] = await connectionDB
      .promise()
      .query(`SELECT id FROM operations WHERE rec_id = ? LIMIT 1`, [
        values.rec_id,
      ]);

    if (existing.length > 0) {
      // UPDATE existing operation
      await connectionDB.promise().query(
        `UPDATE operations SET 
         operation_province_code = ?,
         crop_year = ?, 
         oper_id = ?, 
         crop_id = ?, 
         oper_type = ?, 
         oper_date = ?, 
         no_of_workers = ?, 
         worker_cost = ?, 
         fertilizer_cost = ?, 
         equipment_cost = ?, 
         updated_at = ?, 
         fetch_at = ?,
         company_id = ?
         WHERE rec_id = ?`,
        [
          values.operation_province_code,
          values.crop_year,
          values.oper_id,
          values.crop_id,
          values.oper_type,
          values.oper_date,
          values.no_of_workers,
          values.worker_cost,
          values.fertilizer_cost,
          values.equipment_cost,
          values.updated_at,
          values.fetch_at,
          values.company_id,
          values.rec_id,
        ]
      );

      return { operation: OPERATIONS.UPDATE, recId: values.rec_id };
    } else {
      // INSERT new operation
      await connectionDB.promise().query(
        `INSERT INTO operations 
         (rec_id, operation_province_code, crop_year, oper_id, crop_id, oper_type, oper_date, 
          no_of_workers, worker_cost, fertilizer_cost, equipment_cost, 
          created_at, updated_at, fetch_at, company_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          values.rec_id,
          values.operation_province_code,
          values.crop_year,
          values.oper_id,
          values.crop_id,
          values.oper_type,
          values.oper_date,
          values.no_of_workers,
          values.worker_cost,
          values.fertilizer_cost,
          values.equipment_cost,
          values.created_at,
          values.updated_at,
          values.fetch_at,
          values.company_id,
        ]
      );

      return { operation: OPERATIONS.INSERT, recId: values.rec_id };
    }
  } catch (err) {
    console.error("Operation insert/update error:", err);
    return {
      operation: OPERATIONS.ERROR,
      recId: operation.recId,
      error: err.message,
    };
  }
};

module.exports = {
  insertOrUpdateOperation,
};
