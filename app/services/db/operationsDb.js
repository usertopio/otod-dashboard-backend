// db/operationsDb.js (ESM)

// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";
import { OPERATIONS } from "../../utils/constants.js";
// Add this import (ensure the path ends with .js)
import { getOrInsertProvince } from "./locationHelper.js"; // (Note: currently unused)

// ===================== DB Utilities =====================
// Provides helper functions for reference code lookup and upserting operations

/**
 * Looks up a reference code in a reference table by name.
 * @param {string} table - Reference table name.
 * @param {string} nameColumn - Column for the name.
 * @param {string} codeColumn - Column for the code.
 * @param {string} name - Name to look up.
 * @returns {Promise<string|null>} - The code if found, else null.
 */
export async function getRefCode(table, nameColumn, codeColumn, name) {
  if (!name) return null;
  const [rows] = await connectionDB
    .promise()
    .query(
      `SELECT ${codeColumn} FROM ${table} WHERE ${nameColumn} = ? LIMIT 1`,
      [name]
    );
  return rows.length > 0 ? rows[0][codeColumn] : null;
}

/**
 * Standardized ensures a reference code exists in the table, inserts if not found.
 * @param {string} table - Reference table name.
 * @param {string} nameColumn - Column for the name.
 * @param {string} codeColumn - Column for the code.
 * @param {string} name - Name to look up or insert.
 * @param {string} generatedCodePrefix - Prefix for generated codes.
 * @returns {Promise<string|null>} - The code.
 */
export async function ensureRefCode(
  table,
  nameColumn,
  codeColumn,
  name,
  generatedCodePrefix
) {
  if (!name) return null;

  try {
    // Check if name exists in reference table
    const [existing] = await connectionDB
      .promise()
      .query(
        `SELECT ${codeColumn} FROM ${table} WHERE ${nameColumn} = ? LIMIT 1`,
        [name]
      );

    if (existing.length > 0) {
      return existing[0][codeColumn];
    }

    // Generate new sequential code if not found
    const [maxResult] = await connectionDB
      .promise()
      .query(
        `SELECT ${codeColumn} FROM ${table} WHERE ${codeColumn} LIKE '${generatedCodePrefix}%' ORDER BY ${codeColumn} DESC LIMIT 1`
      );

    let newCode;
    if (maxResult.length > 0) {
      const lastCode = maxResult[0][codeColumn];
      const lastNumber =
        parseInt(String(lastCode).replace(generatedCodePrefix, ""), 10) || 0;
      newCode = `${generatedCodePrefix}${String(lastNumber + 1).padStart(
        3,
        "0"
      )}`;
    } else {
      newCode = `${generatedCodePrefix}001`;
    }

    await connectionDB
      .promise()
      .query(
        `INSERT INTO ${table} (${codeColumn}, ${nameColumn}, source) VALUES (?, ?, 'generated')`,
        [newCode, name]
      );

    console.log(`🆕 Created new ${table}: ${newCode} = "${name}"`);
    return newCode;
  } catch (err) {
    console.error(`${table} lookup error:`, err.message);
    return null;
  }
}

/**
 * Looks up the operation type ID by name in ref_operation_types.
 * @param {string} name - Operation type name.
 * @returns {Promise<number|null>} - The ID if found, else null.
 */
async function getOperationTypeIdByName(name) {
  if (!name) return null;
  const [rows] = await connectionDB
    .promise()
    .query(
      `SELECT id FROM ref_operation_types WHERE operation_type_name = ? LIMIT 1`,
      [name]
    );
  return rows.length > 0 ? rows[0].id : null;
}

/**
 * Inserts or updates an operation record in the database.
 * Maps province name to code and operation type name to ID, checks for existence, and upserts accordingly.
 * @param {object} operation - Operation data object.
 * @returns {Promise<object>} - Operation result.
 */
export async function insertOrUpdateOperation(operation) {
  try {
    // === Map province name to code ===
    const provinceCode = await ensureRefCode(
      "ref_provinces",
      "province_name_th",
      "province_code",
      operation.provinceName,
      "GPROV"
    );

    if (!provinceCode) {
      console.error(
        `Operation insert/update error: operation_province_code is null for rec_id: ${operation.recId} (provinceName: ${operation.provinceName})`
      );
      return {
        operation: OPERATIONS.ERROR,
        error: "operation_province_code is null",
      };
    }

    // === Map operation type name to ID ===
    const operationTypeId = await getOperationTypeIdByName(operation.operType);

    if (!operationTypeId) {
      console.error(
        `Operation insert/update error: operation_type_id is null for rec_id: ${operation.recId} (operType: ${operation.operType})`
      );
      return {
        operation: OPERATIONS.ERROR,
        error: "operation_type_id is null",
      };
    }

    // Prepare values for insert/update
    const values = [
      operation.recId,
      provinceCode,
      operation.cropYear || null,
      operation.operId,
      operation.cropId,
      operationTypeId,
      operation.operDate,
      operation.noOfWorkers,
      operation.workerCost,
      operation.fertilizerCost,
      operation.equipmentCost,
      operation.createdTime,
      operation.updatedTime,
      operation.fetchAt,
      operation.companyId,
    ];

    // Check if record exists
    const [rows] = await connectionDB
      .promise()
      .query("SELECT rec_id FROM operations WHERE rec_id = ? LIMIT 1", [
        operation.recId,
      ]);

    if (rows.length > 0) {
      // Update
      await connectionDB.promise().query(
        `UPDATE operations SET
              operation_province_code = ?, crop_year = ?, oper_id = ?, crop_id = ?, operation_type_id = ?, oper_date = ?,
              no_of_workers = ?, worker_cost = ?, fertilizer_cost = ?, equipment_cost = ?,
              created_at = ?, updated_at = ?, fetch_at = ?, company_id = ?
            WHERE rec_id = ?`,
        [
          provinceCode,
          operation.cropYear || null,
          operation.operId,
          operation.cropId,
          operationTypeId,
          operation.operDate,
          operation.noOfWorkers,
          operation.workerCost,
          operation.fertilizerCost,
          operation.equipmentCost,
          operation.createdTime,
          operation.updatedTime,
          operation.fetchAt,
          operation.companyId,
          operation.recId,
        ]
      );
      return { operation: OPERATIONS.UPDATE };
    }

    // Insert
    await connectionDB.promise().query(
      `INSERT INTO operations
            (rec_id, operation_province_code, crop_year, oper_id, crop_id, operation_type_id, oper_date,
             no_of_workers, worker_cost, fertilizer_cost, equipment_cost,
             created_at, updated_at, fetch_at, company_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values
    );
    return { operation: OPERATIONS.INSERT };
  } catch (err) {
    console.error("Operation insert/update error:", err);
    return { operation: OPERATIONS.ERROR, error: err.message };
  }
}
