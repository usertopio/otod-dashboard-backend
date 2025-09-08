// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";

// ===================== DB Utilities =====================
// Provides helper functions for reference code lookup and upserting farmers

/**
 * Bulk process reference codes for all farmers at once
 */
async function bulkProcessReferenceCodes(farmers) {
  // Get unique values
  const provinces = [
    ...new Set(farmers.map((f) => f.province).filter(Boolean)),
  ];
  const districts = [...new Set(farmers.map((f) => f.amphur).filter(Boolean))];
  const subdistricts = [
    ...new Set(farmers.map((f) => f.tambon).filter(Boolean)),
  ];

  // Bulk lookup/create all reference codes
  const [provinceCodes, districtCodes, subdistrictCodes] = await Promise.all([
    bulkEnsureRefCodes(
      "ref_provinces",
      "province_name_th",
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
 * Bulk ensure reference codes for a list of names
 */
async function bulkEnsureRefCodes(
  table,
  nameColumn,
  codeColumn,
  names,
  prefix
) {
  if (!names.length) return {};

  // Get existing codes in one query
  const [existing] = await connectionDB
    .promise()
    .query(
      `SELECT ${nameColumn}, ${codeColumn} FROM ${table} WHERE ${nameColumn} IN (?)`,
      [names]
    );

  const codeMap = {};
  existing.forEach((row) => {
    codeMap[row[nameColumn]] = row[codeColumn];
  });

  // Find missing names
  const missingNames = names.filter((name) => !codeMap[name]);

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
      codeMap[name] = code;
      return [code, name, "generated"];
    });

    await connectionDB
      .promise()
      .query(
        `INSERT INTO ${table} (${codeColumn}, ${nameColumn}, source) VALUES ?`,
        [insertData]
      );

    console.log(`🆕 Created ${insertData.length} new ${table} codes`);
  }

  return codeMap;
}

/**
 * Bulk insert or update farmers using INSERT ... ON DUPLICATE KEY UPDATE
 * @param {Array} farmers - Array of farmer objects
 * @returns {Promise<object>} - Bulk operation result
 */
export async function bulkInsertOrUpdateFarmers(farmers) {
  if (!farmers || farmers.length === 0) {
    return { inserted: 0, updated: 0, errors: 0 };
  }

  try {
    console.time("⏱️ Reference codes processing");

    // BULK process all reference codes at once
    const { provinceCodes, districtCodes, subdistrictCodes } =
      await bulkProcessReferenceCodes(farmers);

    console.timeEnd("⏱️ Reference codes processing");
    console.time("⏱️ Data preparation");

    // Get current count before operation
    const [countBefore] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM farmers");
    const beforeCount = countBefore[0].count;

    // Prepare farmer data (now much faster - no individual queries)
    const processedFarmers = farmers.map((farmer) => [
      farmer.recId,
      provinceCodes[farmer.province] || null,
      districtCodes[farmer.amphur] || null,
      subdistrictCodes[farmer.tambon] || null,
      farmer.farmerId,
      farmer.title,
      farmer.firstName,
      farmer.lastName,
      farmer.gender,
      farmer.dateOfBirth || null,
      farmer.idCard,
      farmer.idCardExpiryDate || null,
      farmer.addr,
      farmer.postCode,
      farmer.email,
      farmer.mobileNo,
      farmer.lineId,
      farmer.farmerRegistNumber,
      farmer.farmerRegistType,
      farmer.companyId,
      farmer.createdTime,
      farmer.updatedTime,
      new Date(),
    ]);

    console.timeEnd("⏱️ Data preparation");
    console.time("⏱️ Bulk database operation");

    // Execute bulk insert with ON DUPLICATE KEY UPDATE
    const query = `
      INSERT INTO farmers (
        rec_id, farmer_province_code, farmer_district_code, farmer_subdistrict_code, 
        farmer_id, title, first_name, last_name, gender, date_of_birth, id_card, 
        id_card_expiry_date, address, post_code, email, mobile_no, line_id, 
        farmer_regist_number, farmer_regist_type, company_id, created_at, updated_at, fetch_at
      ) VALUES ? 
      ON DUPLICATE KEY UPDATE
        farmer_province_code = VALUES(farmer_province_code),
        farmer_district_code = VALUES(farmer_district_code), 
        farmer_subdistrict_code = VALUES(farmer_subdistrict_code),
        farmer_id = VALUES(farmer_id),
        title = VALUES(title),
        first_name = VALUES(first_name),
        last_name = VALUES(last_name), 
        gender = VALUES(gender),
        date_of_birth = VALUES(date_of_birth),
        id_card = VALUES(id_card),
        id_card_expiry_date = VALUES(id_card_expiry_date),
        address = VALUES(address),
        post_code = VALUES(post_code),
        email = VALUES(email),
        mobile_no = VALUES(mobile_no),
        line_id = VALUES(line_id),
        farmer_regist_number = VALUES(farmer_regist_number),
        farmer_regist_type = VALUES(farmer_regist_type),
        company_id = VALUES(company_id),
        updated_at = VALUES(updated_at),
        fetch_at = VALUES(fetch_at)
    `;

    const [result] = await connectionDB
      .promise()
      .query(query, [processedFarmers]);

    console.timeEnd("⏱️ Bulk database operation");

    // Get count after operation
    const [countAfter] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM farmers");
    const afterCount = countAfter[0].count;

    const actualInserts = afterCount - beforeCount;
    const actualUpdates = farmers.length - actualInserts;

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
      totalProcessed: farmers.length,
    };
  } catch (err) {
    console.error("Bulk farmer insert/update error:", err);
    return {
      operation: "BULK_ERROR",
      inserted: 0,
      updated: 0,
      errors: farmers.length,
      error: err.message,
    };
  }
}
