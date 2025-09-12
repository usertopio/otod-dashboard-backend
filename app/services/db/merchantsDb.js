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
 * Bulk process reference codes for all merchants at once
 */
export async function bulkProcessReferenceCodes(merchants) {
  // Get unique values
  const provinces = [
    ...new Set(merchants.map((m) => m.province).filter(Boolean)),
  ];
  const districts = [
    ...new Set(merchants.map((m) => m.district).filter(Boolean)),
  ];
  const subdistricts = [
    ...new Set(merchants.map((m) => m.subdistrict).filter(Boolean)),
  ];

  // Bulk lookup/create all reference codes
  const [provinceCodes, districtCodes, subdistrictCodes] = await Promise.all([
    bulkEnsureRefCodes(
      "ref_provinces",
      "province_name",
      "province_code",
      provinces,
      "GPROV"
    ),
    bulkEnsureRefCodes(
      "ref_districts",
      "district_name_th",
      "district_code",
      districts,
      "GDIST"
    ),
    bulkEnsureRefCodes(
      "ref_subdistricts",
      "subdistrict_name_th",
      "subdistrict_code",
      subdistricts,
      "GSUBDIST"
    ),
  ]);

  return { provinceCodes, districtCodes, subdistrictCodes };
}

/**
 * Bulk insert or update merchants using INSERT ... ON DUPLICATE KEY UPDATE
 * @param {Array} merchants - Array of merchant objects
 * @returns {Promise<object>} - Bulk operation result
 */
export async function bulkInsertOrUpdateMerchants(merchants) {
  if (!merchants || merchants.length === 0) {
    return { inserted: 0, updated: 0, errors: 0 };
  }

  try {
    console.time("⏱️ Reference codes processing");

    // BULK process all reference codes at once
    const { provinceCodes, districtCodes, subdistrictCodes } =
      await bulkProcessReferenceCodes(merchants);

    console.timeEnd("⏱️ Reference codes processing");
    console.time("⏱️ Data preparation");

    // Get current count before operation
    const [countBefore] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM merchants");
    const beforeCount = countBefore[0].count;

    // ✅ ADD: Get Bangkok time (same as other modules)
    const bangkokTime = getBangkokTime();

    // Prepare merchant data
    const merchantData = merchants.map((merchant) => [
      merchant.recId,
      merchant.merchantName,
      provinceCodes.get(merchant.province) || null,
      districtCodes.get(merchant.district) || null,
      subdistrictCodes.get(merchant.subdistrict) || null,
      merchant.lat,
      merchant.lon,
      merchant.createdTime,
      merchant.updatedTime,
      merchant.companyId,
      merchant.companyName,
      bangkokTime, // ✅ CHANGED: Use bangkokTime instead of new Date()
    ]);

    console.timeEnd("⏱️ Data preparation");
    console.time("⏱️ Bulk database operation");

    // ✅ CHANGED: Use VALUES(fetch_at) pattern like other modules
    const insertQuery = `
      INSERT INTO merchants (
        rec_id, merchant_name, province_code, district_code, subdistrict_code,
        lat, lon, created_time, updated_time, company_id, company_name, fetch_at
      ) VALUES ? 
      ON DUPLICATE KEY UPDATE
        merchant_name = VALUES(merchant_name),
        province_code = VALUES(province_code),
        district_code = VALUES(district_code),
        subdistrict_code = VALUES(subdistrict_code),
        lat = VALUES(lat),
        lon = VALUES(lon),
        created_time = VALUES(created_time),
        updated_time = VALUES(updated_time),
        company_id = VALUES(company_id),
        company_name = VALUES(company_name),
        fetch_at = VALUES(fetch_at)  -- ✅ CHANGED: Use VALUES(fetch_at) like other modules
    `;

    // ✅ CHANGED: Use merchantData directly (bangkokTime already in array)
    const [result] = await connectionDB
      .promise()
      .query(insertQuery, [merchantData]);

    console.timeEnd("⏱️ Bulk database operation");

    // Get count after operation
    const [countAfter] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM merchants");
    const afterCount = countAfter[0].count;

    // Calculate actual inserts and updates
    const actualInserts = afterCount - beforeCount;
    const actualUpdates = merchants.length - actualInserts;

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
      totalProcessed: merchants.length,
    };
  } catch (err) {
    console.error("Bulk merchant insert/update error:", err);
    return {
      operation: "BULK_ERROR",
      inserted: 0,
      updated: 0,
      errors: merchants.length,
      totalProcessed: merchants.length,
    };
  }
}
