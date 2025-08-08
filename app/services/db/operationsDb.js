// ===================== Imports =====================
// Import DB connection for executing SQL queries
const { connectionDB } = require("../../config/db/db.conf.js");
const { OPERATIONS } = require("../../utils/constants");

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
    // Check if operation already exists
    const [existing] = await connectionDB
      .promise()
      .query(`SELECT id FROM operations WHERE rec_id = ? LIMIT 1`, [
        operation.recId,
      ]);

    if (existing.length > 0) {
      // UPDATE existing operation
      await connectionDB.promise().query(
        `UPDATE operations SET 
         crop_year = ?, 
         oper_id = ?, 
         crop_id = ?, 
         oper_type = ?, 
         oper_date = ?, 
         no_of_workers = ?, 
         worker_cost = ?, 
         fertilizer_cost = ?, 
         equipment_cost = ?, 
         updated_at = NOW(),
         fetch_at = NOW(),
         company_id = ?
         WHERE rec_id = ?`,
        [
          operation.cropYear || null,
          operation.operId,
          operation.cropId,
          operation.operType || null,
          operation.operDate || null,
          operation.noOfWorkers || null,
          operation.workerCost || null,
          operation.fertilizerCost || null,
          operation.equipmentCost || null,
          operation.companyId || null,
          operation.recId,
        ]
      );

      return { operation: OPERATIONS.UPDATE, recId: operation.recId };
    } else {
      // INSERT new operation
      await connectionDB.promise().query(
        `INSERT INTO operations 
         (rec_id, crop_year, oper_id, crop_id, oper_type, oper_date, 
          no_of_workers, worker_cost, fertilizer_cost, equipment_cost, 
          created_at, updated_at, fetch_at, company_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW(), ?)`,
        [
          operation.recId,
          operation.cropYear || null,
          operation.operId,
          operation.cropId,
          operation.operType || null,
          operation.operDate || null,
          operation.noOfWorkers || null,
          operation.workerCost || null,
          operation.fertilizerCost || null,
          operation.equipmentCost || null,
          operation.companyId || null,
        ]
      );

      return { operation: OPERATIONS.INSERT, recId: operation.recId };
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
