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
 * Bulk insert or update water records using INSERT ... ON DUPLICATE KEY UPDATE
 * @param {Array} waterRecords - Array of water objects
 * @returns {Promise<object>} - Bulk operation result
 */
export async function bulkInsertOrUpdateWater(waterRecords) {
  if (!waterRecords || waterRecords.length === 0) {
    return { inserted: 0, updated: 0, errors: 0 };
  }

  try {
    console.time("⏱️ Data preparation");

    // Get current count before operation
    const [countBefore] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM water");
    const beforeCount = countBefore[0].count;

    // Get Bangkok time
    const bangkokTime = getBangkokTime();

    // Prepare water data for bulk insert
    const waterData = waterRecords.map((water) => [
      water.cropYear,
      water.provinceName,
      water.operMonth ? `${water.operMonth}-01` : null,
      water.totalLitre || 0,
      bangkokTime,
    ]);

    console.timeEnd("⏱️ Data preparation");
    console.time("⏱️ Bulk database operation");

    const insertQuery = `
      INSERT INTO water (
        crop_year, province, oper_month, total_litre, fetch_at
      ) VALUES ?
      ON DUPLICATE KEY UPDATE
        total_litre = VALUES(total_litre),
        fetch_at = VALUES(fetch_at)
    `;

    const [result] = await connectionDB
      .promise()
      .query(insertQuery, [waterData]);

    console.timeEnd("⏱️ Bulk database operation");

    // Get count after operation
    const [countAfter] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM water");
    const afterCount = countAfter[0].count;

    // Calculate actual inserts and updates
    const actualInserts = afterCount - beforeCount;
    const actualUpdates = waterRecords.length - actualInserts;

    console.log(
      `📊 Bulk operation: ${actualInserts} inserted, ${actualUpdates} updated`
    );
    console.log(
      `📊 Database: ${beforeCount} → ${afterCount} (${
        actualInserts > 0 ? "+" + actualInserts : "no change"
      })`
    );

    return {
      operation: "BULK_UPSERT",
      inserted: actualInserts,
      updated: Math.max(0, actualUpdates),
      errors: 0,
      totalProcessed: waterRecords.length,
    };
  } catch (err) {
    console.error("Bulk water insert/update error:", err);
    return {
      operation: "BULK_ERROR",
      inserted: 0,
      updated: 0,
      errors: waterRecords.length,
      totalProcessed: waterRecords.length,
    };
  }
}
