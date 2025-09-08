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
 * Bulk process reference codes for all merchants at once
 */
async function bulkProcessReferenceCodes(merchants) {
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
      "district_name",
      "district_code",
      districts,
      "GDIST"
    ),
    bulkEnsureRefCodes(
      "ref_subdistricts",
      "subdistrict_name",
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

    // Prepare merchant data
    const merchantData = merchants.map((merchant) => [
      merchant.recId, // rec_id
      merchant.merchantName, // merchant_name
      provinceCodes.get(merchant.province) || null, // province_code
      districtCodes.get(merchant.district) || null, // district_code
      subdistrictCodes.get(merchant.subdistrict) || null, // subdistrict_code
      merchant.lat, // lat
      merchant.lon, // lon
      merchant.createdTime, // created_time
      merchant.updatedTime, // updated_time
      merchant.companyId, // company_id
      merchant.companyName, // company_name
      new Date(), // fetch_at
    ]);

    console.timeEnd("⏱️ Data preparation");
    console.time("⏱️ Bulk database operation");

    // Bulk insert/update query
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
        fetch_at = VALUES(fetch_at)
    `;

    // Execute bulk operation
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
