// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";

/**
 * Get Bangkok timezone timestamp as MySQL-compatible string
 */
function getBangkokTime() {
  return new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" })
    .replace(" ", "T");
}

/**
 * Bulk insert or update substances using INSERT ... ON DUPLICATE KEY UPDATE
 * @param {Array} substances - Array of substance objects
 * @returns {Promise<object>} - Bulk operation result
 */
export async function bulkInsertOrUpdateSubstances(substances) {
  if (!substances || substances.length === 0) {
    return { inserted: 0, updated: 0, errors: 0 };
  }

  const bangkokTime = getBangkokTime();

  // Use raw province name from API
  const substanceData = substances.map((substance) => [
    substance.cropYear,
    substance.provinceName,
    substance.substance,
    substance.operMonth ? `${substance.operMonth}-01` : null, // <-- Fix here
    substance.totalRecords ?? 0,
    bangkokTime,
  ]);

  const query = `
    INSERT INTO substance (
      crop_year, province, substance, oper_month, total_records, fetch_at
    ) VALUES ?
    ON DUPLICATE KEY UPDATE
      total_records = VALUES(total_records),
      fetch_at = VALUES(fetch_at)
  `;

  const [result] = await connectionDB.promise().query(query, [substanceData]);

  return {
    inserted: result.affectedRows,
    updated: 0,
    errors: 0,
    totalAfter: substanceData.length,
  };
}
