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
  if (!names || names.length === 0) {
    return new Map();
  }

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
 * Get all existing crop_ids from crops table for validation
 */
const getValidCropIds = async () => {
  try {
    const [rows] = await connectionDB
      .promise()
      .query("SELECT DISTINCT crop_id FROM crops");
    return new Set(rows.map((row) => row.crop_id));
  } catch (err) {
    console.error("Error fetching valid crop IDs:", err);
    return new Set();
  }
};

/**
 * Bulk process reference codes for all operations at once
 */
const bulkProcessReferenceCodes = async (operations) => {
  console.time("Reference codes processing");

  try {
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
      // ✅ FIX: Use correct column names for ref_operation_types table
      bulkEnsureRefCodes(
        "ref_operation_types",
        "operation_type_name",
        "operation_type_id",
        operationTypes,
        "GOPER"
      ),
    ]);

    console.timeEnd("Reference codes processing");
    return { provinceCodes, operationTypeCodes };
  } catch (error) {
    console.error("❌ Error in bulkProcessReferenceCodes:", error);
    console.timeEnd("Reference codes processing");
    return { provinceCodes: new Map(), operationTypeCodes: new Map() };
  }
};

/**
 * Bulk insert or update operations using INSERT ... ON DUPLICATE KEY UPDATE
 */
const bulkInsertOrUpdateOperations = async (operations) => {
  if (!operations || operations.length === 0) {
    return { inserted: 0, updated: 0, errors: 0, skipped: 0 };
  }

  const connection = connectionDB.promise();

  try {
    // Process reference codes
    const { provinceCodes, operationTypeCodes } =
      await bulkProcessReferenceCodes(operations);

    console.time("Crop validation");
    // Get all valid crop_ids from crops table
    const validCropIds = await getValidCropIds();
    console.timeEnd("Crop validation");

    console.time("Data preparation");

    // Get current count before operation
    const [countBefore] = await connection.query(
      "SELECT COUNT(*) as count FROM operations"
    );
    const beforeCount = countBefore[0].count;

    // Filter operations with valid crop_ids and prepare data
    const validOperations = [];
    const skippedOperations = [];

    for (const operation of operations) {
      // Validate if crop_id exists in crops table
      if (!validCropIds.has(operation.cropId)) {
        skippedOperations.push({
          recId: operation.recId,
          cropId: operation.cropId,
          reason: "missing_crop_reference",
        });
        continue;
      }

      // Get reference codes
      const provinceCode = provinceCodes.get(operation.provinceName) || null;
      const operationTypeCode =
        operationTypeCodes.get(operation.operType) || null;

      validOperations.push([
        operation.recId, // rec_id
        provinceCode, // operation_province_code
        // ✅ FIX: Use ?? to preserve 0 values for numeric fields
        operation.cropYear ?? null, // crop_year - preserves 0
        operation.operId, // oper_id
        operation.cropId, // crop_id
        operationTypeCode, // operation_type_id (matches schema)
        operation.operDate || null, // oper_date
        operation.noOfWorkers ?? null, // no_of_workers - preserves 0
        operation.workerCost ?? null, // worker_cost - preserves 0
        operation.fertilizerCost ?? null, // fertilizer_cost - preserves 0
        operation.equipmentCost ?? null, // equipment_cost - preserves 0
        operation.createdTime || null, // created_at
        operation.updatedTime || null, // updated_at
        operation.companyId ?? null, // company_id
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
      console.timeEnd("Data preparation");
      console.time("Bulk database operation");

      // ✅ FIX: Add fetch_at timestamp to each row
      const dataWithTimestamp = validOperations.map((row) => [
        ...row,
        new Date(),
      ]);

      // Execute bulk insert with ON DUPLICATE KEY UPDATE
      const sql = `
        INSERT INTO operations (
          rec_id, operation_province_code, crop_year, oper_id, crop_id, operation_type_id, 
          oper_date, no_of_workers, worker_cost, fertilizer_cost, equipment_cost,
          created_at, updated_at, company_id, fetch_at
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
          company_id = VALUES(company_id),
          fetch_at = NOW()
      `;

      const [result] = await connection.query(sql, [dataWithTimestamp]);

      console.timeEnd("Bulk database operation");

      // Get count after operation
      const [countAfter] = await connection.query(
        "SELECT COUNT(*) as count FROM operations"
      );
      const afterCount = countAfter[0].count;

      actualInserts = afterCount - beforeCount;
      actualUpdates = validOperations.length - actualInserts;
    } else {
      console.timeEnd("Data preparation");
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
      inserted: actualInserts,
      updated: Math.max(0, actualUpdates),
      errors: 0,
      skipped: skippedOperations.length,
      totalProcessed: operations.length,
      affectedRows: result?.affectedRows || 0,
    };
  } catch (error) {
    console.error("❌ Bulk operation insert/update error:", error);
    return {
      inserted: 0,
      updated: 0,
      errors: operations.length,
      skipped: 0,
      totalProcessed: operations.length,
      error: error.message,
    };
  }
};

/**
 * Get the current count of operations in the database
 */
const getOperationsCount = async () => {
  try {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM operations");
    return result[0].total;
  } catch (error) {
    console.error("❌ Error getting operations count:", error);
    return 0;
  }
};

/**
 * Reset the operations table
 */
const resetOperationsTable = async () => {
  const connection = connectionDB.promise();

  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    await connection.query("TRUNCATE TABLE operations");
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    return { success: true, message: "Operations table reset successfully" };
  } catch (error) {
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    console.error("❌ Error resetting operations table:", error);
    throw error;
  }
};

// Named exports (ESM style)
export {
  bulkInsertOrUpdateOperations,
  getOperationsCount,
  resetOperationsTable,
  bulkProcessReferenceCodes,
};
