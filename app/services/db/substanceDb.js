// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";

// ✅ ADD: Same getBangkokTime function as other modules
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
 * Bulk process reference codes for all substances at once
 */
export async function bulkProcessReferenceCodes(substances) {
  console.time("⏱️ Reference codes processing");

  try {
    // Extract unique province names from substances
    const provinces = [
      ...new Set(substances.map((s) => s.provinceName).filter(Boolean)),
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
 * Bulk insert or update substances using INSERT ... ON DUPLICATE KEY UPDATE
 * @param {Array} substances - Array of substance objects
 * @returns {Promise<object>} - Bulk operation result
 */
export async function bulkInsertOrUpdateSubstances(substances) {
  if (!substances || substances.length === 0) {
    return { inserted: 0, updated: 0, errors: 0 };
  }

  try {
    console.time("⏱️ Reference codes processing");

    // BULK process all reference codes at once
    const { provinceCodes } = await bulkProcessReferenceCodes(substances);

    console.timeEnd("⏱️ Reference codes processing");
    console.time("⏱️ Data preparation");

    // Get current count before operation
    const [countBefore] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM substance");
    const beforeCount = countBefore[0].count;

    // ✅ ADD: Get Bangkok time (same as other modules)
    const bangkokTime = getBangkokTime();

    // Prepare substance data
    const substanceData = substances.map((substance) => [
      substance.cropYear, // crop_year
      provinceCodes.get(substance.provinceName) || null, // province_code
      substance.substance, // substance
      `${substance.operMonth}-01`, // oper_month (converted to date format)
      substance.totalRecords || 0, // total_records
      bangkokTime, // ✅ CHANGED: Use bangkokTime instead of NOW()
    ]);

    console.timeEnd("⏱️ Data preparation");
    console.time("⏱️ Bulk database operation");

    // ✅ CHANGED: Use VALUES ? pattern with bangkokTime in data
    const insertQuery = `
      INSERT INTO substance (
        crop_year, province_code, substance, oper_month, total_records, fetch_at
      ) VALUES ?
      ON DUPLICATE KEY UPDATE
        total_records = VALUES(total_records),
        fetch_at = VALUES(fetch_at)  -- ✅ CHANGED: Use VALUES(fetch_at) like other modules
    `;

    // ✅ CHANGED: Use substanceData directly (bangkokTime already in array)
    const [result] = await connectionDB
      .promise()
      .query(insertQuery, [substanceData]);

    console.timeEnd("⏱️ Bulk database operation");

    // Get count after operation
    const [countAfter] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM substance");
    const afterCount = countAfter[0].count;

    // Calculate actual inserts and updates
    const actualInserts = afterCount - beforeCount;
    const actualUpdates = substances.length - actualInserts;

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
      totalProcessed: substances.length,
    };
  } catch (err) {
    console.error("Bulk substance insert/update error:", err);
    return {
      operation: "BULK_ERROR",
      inserted: 0,
      updated: 0,
      errors: substances.length,
      totalProcessed: substances.length,
    };
  }
}
