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
 * Bulk ensure reference codes for a list of names
 */
async function bulkEnsureRefCodes(
  table,
  nameColumn,
  codeColumn,
  names,
  prefix
) {
  if (!names || names.length === 0) return new Map();

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
}

/**
 * Bulk process reference codes for all water records at once
 */
export async function bulkProcessReferenceCodes(waterRecords) {
  console.time("⏱️ Reference codes processing");

  try {
    // Extract unique province names from water records
    const provinces = [
      ...new Set(waterRecords.map((w) => w.provinceName).filter(Boolean)),
    ];

    // Process reference codes for provinces
    const provinceCodes = await bulkEnsureRefCodes(
      "ref_provinces",
      "province_name_th",
      "province_code",
      provinces,
      "GPROV"
    );

    console.timeEnd("⏱️ Reference codes processing");
    return { provinceCodes };
  } catch (error) {
    console.error("❌ Error in bulkProcessReferenceCodes:", error);
    console.timeEnd("⏱️ Reference codes processing");
    return { provinceCodes: new Map() };
  }
}

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
    console.time("⏱️ Reference codes processing");

    // BULK process all reference codes at once
    const { provinceCodes } = await bulkProcessReferenceCodes(waterRecords);

    console.timeEnd("⏱️ Reference codes processing");
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

    // ✅ CHANGED: Use waterData directly (bangkokTime already in array)
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
