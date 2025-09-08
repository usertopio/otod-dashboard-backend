// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";
import { OPERATIONS } from "../../utils/constants.js";

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
  if (!names || names.length === 0) {
    return new Map();
  }

  try {
    // Get existing codes
    const placeholders = names.map(() => "?").join(",");
    const selectQuery = `SELECT ${nameColumn}, ${codeColumn} FROM ${table} WHERE ${nameColumn} IN (${placeholders})`;
    const [existing] = await connectionDB.promise().query(selectQuery, names);

    const codeMap = new Map();
    const existingNames = new Set();

    existing.forEach((row) => {
      codeMap.set(row[nameColumn], row[codeColumn]);
      existingNames.add(row[nameColumn]);
    });

    // Find missing names
    const missingNames = names.filter((name) => !existingNames.has(name));

    if (missingNames.length > 0) {
      // Get next available code number
      const maxQuery = `SELECT MAX(CAST(SUBSTRING(${codeColumn}, ${
        prefix.length + 1
      }) AS UNSIGNED)) as maxNum FROM ${table} WHERE ${codeColumn} LIKE '${prefix}%'`;
      const [maxResult] = await connectionDB.promise().query(maxQuery);
      let nextNum = (maxResult[0]?.maxNum || 0) + 1;

      // Insert missing codes
      const insertData = missingNames.map((name) => {
        const newCode = `${prefix}${nextNum.toString().padStart(3, "0")}`;
        codeMap.set(name, newCode);
        nextNum++;
        return [newCode, name];
      });

      const insertQuery = `INSERT INTO ${table} (${codeColumn}, ${nameColumn}) VALUES ?`;
      await connectionDB.promise().query(insertQuery, [insertData]);

      console.log(`🆕 Created ${insertData.length} new ${table} codes`);
    }

    return codeMap;
  } catch (err) {
    console.error(`Bulk ${table} lookup error:`, err);
    return new Map();
  }
}

/**
 * Get all existing crop_ids from crops table for validation
 */
async function getValidCropIds() {
  try {
    const [rows] = await connectionDB
      .promise()
      .query("SELECT DISTINCT crop_id FROM crops");
    return new Set(rows.map((row) => row.crop_id));
  } catch (err) {
    console.error("Error fetching valid crop IDs:", err);
    return new Set();
  }
}

/**
 * Bulk process reference codes for all operations at once
 */
async function bulkProcessReferenceCodes(operations) {
  // Get unique values
  const provinceNames = [
    ...new Set(operations.map((op) => op.provinceName).filter(Boolean)),
  ];
  const operationTypes = [
    ...new Set(operations.map((op) => op.operType).filter(Boolean)),
  ];

  // Bulk lookup/create all reference codes
  const [provinceCodes, operationTypeCodes] = await Promise.all([
    bulkEnsureRefCodes(
      "ref_provinces",
      "province_name_th",
      "province_code",
      provinceNames,
      "GPROV"
    ),
    bulkEnsureRefCodes(
      "ref_operation_types",
      "operation_type_name",
      "operation_type_id",
      operationTypes,
      "OT"
    ),
  ]);

  return { provinceCodes, operationTypeCodes };
}

/**
 * Bulk insert or update operations using INSERT ... ON DUPLICATE KEY UPDATE
 * @param {Array} operations - Array of operation objects
 * @returns {Promise<object>} - Bulk operation result
 */
export async function bulkInsertOrUpdateOperations(operations) {
  if (!operations || operations.length === 0) {
    return { inserted: 0, updated: 0, errors: 0, skipped: 0 };
  }

  try {
    console.time("⏱️ Reference codes processing");

    // BULK process all reference codes at once
    const { provinceCodes, operationTypeCodes } =
      await bulkProcessReferenceCodes(operations);

    console.timeEnd("⏱️ Reference codes processing");
    console.time("⏱️ Crop validation");

    // Get all valid crop_ids from crops table
    const validCropIds = await getValidCropIds();

    console.timeEnd("⏱️ Crop validation");
    console.time("⏱️ Data preparation");

    // Get current count before operation
    const [countBefore] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM operations");
    const beforeCount = countBefore[0].count;

    // Filter operations with valid crop_ids and prepare data
    const validOperations = [];
    const skippedOperations = [];

    for (const operation of operations) {
      // ✅ VALIDATE: Check if crop_id exists in crops table
      if (!validCropIds.has(operation.cropId)) {
        skippedOperations.push({
          recId: operation.recId,
          cropId: operation.cropId,
          reason: "missing_crop_reference",
        });
        continue;
      }

      // Get province code and operation type ID
      const provinceCode = provinceCodes.get(operation.provinceName) || null;
      const operationTypeId =
        operationTypeCodes.get(operation.operType) || null;

      if (!provinceCode || !operationTypeId) {
        skippedOperations.push({
          recId: operation.recId,
          cropId: operation.cropId,
          reason: !provinceCode
            ? "missing_province_code"
            : "missing_operation_type",
        });
        continue;
      }

      validOperations.push([
        operation.recId, // rec_id
        provinceCode, // operation_province_code
        operation.cropYear || null, // crop_year
        operation.operId, // oper_id
        operation.cropId, // crop_id
        operationTypeId, // operation_type_id
        operation.operDate, // oper_date
        operation.noOfWorkers, // no_of_workers
        operation.workerCost, // worker_cost
        operation.fertilizerCost, // fertilizer_cost
        operation.equipmentCost, // equipment_cost
        operation.createdTime, // created_at
        operation.updatedTime, // updated_at
        operation.fetchAt, // fetch_at
        operation.companyId, // company_id
      ]);
    }

    console.log(
      `📊 Validation: ${validOperations.length} valid, ${skippedOperations.length} skipped operations`
    );

    if (skippedOperations.length > 0) {
      console.warn(
        `⚠️  Skipped ${skippedOperations.length} operations with missing references`
      );
      // Log first few examples
      skippedOperations.slice(0, 5).forEach((skip) => {
        console.warn(
          `   - Operation ${skip.recId}: ${skip.reason} (crop_id: '${skip.cropId}')`
        );
      });
    }

    let actualInserts = 0;
    let actualUpdates = 0;

    if (validOperations.length > 0) {
      console.timeEnd("⏱️ Data preparation");
      console.time("⏱️ Bulk database operation");

      // Execute bulk insert with ON DUPLICATE KEY UPDATE
      const query = `
        INSERT INTO operations (
          rec_id, operation_province_code, crop_year, oper_id, crop_id, operation_type_id, 
          oper_date, no_of_workers, worker_cost, fertilizer_cost, equipment_cost,
          created_at, updated_at, fetch_at, company_id
        ) VALUES ? 
        ON DUPLICATE KEY UPDATE
          operation_province_code = VALUES(operation_province_code),
          crop_year = VALUES(crop_year),
          oper_id = VALUES(oper_id),
          crop_id = VALUES(crop_id),
          operation_type_id = VALUES(operation_type_id),
          oper_date = VALUES(oper_date),
          no_of_workers = VALUES(no_of_workers),
          worker_cost = VALUES(worker_cost),
          fertilizer_cost = VALUES(fertilizer_cost),
          equipment_cost = VALUES(equipment_cost),
          updated_at = VALUES(updated_at),
          fetch_at = VALUES(fetch_at)
      `;

      const [result] = await connectionDB
        .promise()
        .query(query, [validOperations]);

      console.timeEnd("⏱️ Bulk database operation");

      // Get count after operation
      const [countAfter] = await connectionDB
        .promise()
        .query("SELECT COUNT(*) as count FROM operations");
      const afterCount = countAfter[0].count;

      actualInserts = afterCount - beforeCount;
      actualUpdates = validOperations.length - actualInserts;
    } else {
      console.timeEnd("⏱️ Data preparation");
      console.log(
        "⚠️  No valid operations to process - all skipped due to missing references"
      );
    }

    console.log(
      `📊 Bulk operation: ${actualInserts} inserted, ${actualUpdates} updated, ${skippedOperations.length} skipped`
    );
    console.log(
      `📊 Database: ${beforeCount} → ${beforeCount + actualInserts} (${
        actualInserts > 0 ? "+" + actualInserts : "no change"
      })`
    );

    return {
      operation: "BULK_UPSERT",
      inserted: actualInserts,
      updated: Math.max(0, actualUpdates),
      errors: 0,
      skipped: skippedOperations.length,
      totalProcessed: operations.length,
      skippedDetails: skippedOperations.slice(0, 10), // First 10 for debugging
    };
  } catch (err) {
    console.error("Bulk operation insert/update error:", err);
    return {
      operation: "BULK_ERROR",
      inserted: 0,
      updated: 0,
      errors: operations.length,
      skipped: 0,
      error: err.message,
    };
  }
}
