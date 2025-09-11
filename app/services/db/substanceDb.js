// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";

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
 * Bulk process reference codes for all substances at once
 */
export async function bulkProcessReferenceCodes(substances) {
  // Get unique province names
  const provinceNames = [
    ...new Set(substances.map((s) => s.provinceName).filter(Boolean)),
  ];

  // Bulk lookup/create all reference codes
  const [provinceCodes] = await Promise.all([
    bulkEnsureRefCodes(
      "ref_provinces",
      "province_name_th",
      "province_code",
      provinceNames,
      "GPROV"
    ),
  ]);

  return { provinceCodes };
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

    // Prepare substance data
    const substanceData = substances.map((substance) => [
      substance.cropYear, // crop_year
      provinceCodes.get(substance.provinceName) || null, // province_code
      substance.substance, // substance
      `${substance.operMonth}-01`, // oper_month (converted to date format)
      substance.totalRecords || 0, // total_records
    ]);

    console.timeEnd("⏱️ Data preparation");
    console.time("⏱️ Bulk database operation");

    // Bulk insert/update query with proper unique key handling
    const insertQuery = `
      INSERT INTO substance (
        crop_year, province_code, substance, oper_month, total_records, fetch_at
      ) VALUES ${substances
        .map(
          () => "(?, ?, ?, STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d'), ?, NOW())"
        )
        .join(", ")}
      ON DUPLICATE KEY UPDATE
        total_records = VALUES(total_records),
        fetch_at = VALUES(fetch_at)
    `;

    // Flatten the data for the parameterized query
    const flatData = substances.flatMap((substance) => [
      substance.cropYear, // crop_year
      provinceCodes.get(substance.provinceName) || null, // province_code
      substance.substance, // substance
      substance.operMonth, // oper_month
      substance.totalRecords || 0, // total_records
    ]);

    // Execute bulk operation
    const [result] = await connectionDB.promise().query(insertQuery, flatData);

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
