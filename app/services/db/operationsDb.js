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
async function ensureOperationTypeId(operationTypeName) {
  if (!operationTypeName) return null;
  try {
    // Try to find existing
    const [existing] = await connectionDB
      .promise()
      .query(
        `SELECT operation_type_id FROM ref_operation_types WHERE operation_type_name = ? LIMIT 1`,
        [operationTypeName]
      );
    if (existing.length > 0) {
      return existing[0].operation_type_id;
    }
    // Insert new if not found
    const generatedId = `OTYPE${Date.now()}`;
    await connectionDB
      .promise()
      .query(
        `INSERT INTO ref_operation_types (operation_type_id, operation_type_name, source) VALUES (?, ?, 'generated')`,
        [generatedId, operationTypeName]
      );
    return generatedId;
  } catch (err) {
    console.error("ref_operation_types lookup error:", err.message);
    return null;
  }
}

const insertOrUpdateOperation = async (operation) => {
  try {
    // === Map province name to code ===
    let provinceCode = null;
    if (operation.province) {
      const province = await getOrInsertProvince(operation.province);
      provinceCode = province ? province.province_code : null;
    }

    // === Map operation type to operation_type_id ===
    const operationTypeId = await ensureOperationTypeId(operation.operType);

    // === Prepare values ===
    const values = {
      rec_id: operation.recId,
      operation_province_code: provinceCode,
      crop_year: operation.cropYear || null,
      oper_id: operation.operId,
      crop_id: operation.cropId,
      operation_type_id: operationTypeId,
      oper_date: operation.operDate || null,
      no_of_workers: operation.noOfWorkers || null,
      worker_cost: operation.workerCost || null,
      fertilizer_cost: operation.fertilizerCost || null,
      equipment_cost: operation.equipmentCost || null,
      created_at: operation.createdAt || null,
      updated_at: operation.updatedAt || null,
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
         operation_type_id = ?, 
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
          values.operation_type_id,
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
         (rec_id, operation_province_code, crop_year, oper_id, crop_id, operation_type_id, oper_date, 
          no_of_workers, worker_cost, fertilizer_cost, equipment_cost, 
          created_at, updated_at, fetch_at, company_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          values.rec_id,
          values.operation_province_code,
          values.crop_year,
          values.oper_id,
          values.crop_id,
          values.operation_type_id,
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
