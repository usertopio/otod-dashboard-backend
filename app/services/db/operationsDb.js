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
 * Bulk insert or update operations using INSERT ... ON DUPLICATE KEY UPDATE
 */
export async function bulkInsertOrUpdateOperations(operations) {
  if (!operations || operations.length === 0) {
    return { inserted: 0, updated: 0, errors: 0, skipped: 0 };
  }

  const connection = connectionDB.promise();

  try {
    console.time("Data preparation");

    // Get current count before operation
    const [countBefore] = await connection.query(
      "SELECT COUNT(*) as count FROM operations"
    );
    const beforeCount = countBefore[0].count;

    // Get Bangkok time
    const bangkokTime = getBangkokTime();

    // Prepare all operations for insertion (no validation)
    const validOperations = [];

    for (const operation of operations) {
      // Use API values directly (no reference code mapping)
      validOperations.push([
        operation.recId,
        operation.provinceName,
        operation.cropYear ?? null,
        operation.operId,
        operation.cropId,
        operation.operType,
        operation.operDate || null,
        operation.noOfWorkers ?? null,
        operation.workerCost ?? null,
        operation.fertilizerCost ?? null,
        operation.equipmentCost ?? null,
        operation.createdTime || null,
        operation.updatedTime || null,
        operation.companyId ?? null,
        bangkokTime,
      ]);
    }

    let actualInserts = 0;
    let actualUpdates = 0;
    let result = null;

    if (validOperations.length > 0) {
      console.timeEnd("Data preparation");
      console.time("Bulk database operation");

      // Execute bulk insert with ON DUPLICATE KEY UPDATE
      const sql = `
        INSERT INTO operations (
          rec_id, province, crop_year, oper_id, crop_id, operation_type, 
          oper_date, no_of_workers, worker_cost, fertilizer_cost, equipment_cost,
          created_at, updated_at, company_id, fetch_at
        ) VALUES ? 
        ON DUPLICATE KEY UPDATE
          province = VALUES(province),
          crop_year = VALUES(crop_year),
          oper_id = VALUES(oper_id),
          crop_id = VALUES(crop_id),
          operation_type = VALUES(operation_type),
          oper_date = VALUES(oper_date),
          no_of_workers = VALUES(no_of_workers),
          worker_cost = VALUES(worker_cost),
          fertilizer_cost = VALUES(fertilizer_cost),
          equipment_cost = VALUES(equipment_cost),
          updated_at = VALUES(updated_at),
          company_id = VALUES(company_id),
          fetch_at = VALUES(fetch_at)
      `;

      // Use validOperations directly
      [result] = await connection.query(sql, [validOperations]);

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
        "⚠️  No operations to process"
      );
    }

    console.log(
      `📊 Bulk operation: ${actualInserts} inserted, ${actualUpdates} updated`
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
      skipped: 0,
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
}
