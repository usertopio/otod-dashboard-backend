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

// ===================== DB Utilities =====================
// Provides helper functions for reference code lookup and upserting farmers

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
  if (!names || names.length === 0) return {};

  try {
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

      const insertQuery = `INSERT INTO ${table} (${codeColumn}, ${nameColumn}, source) VALUES ?`;
      await connectionDB.promise().query(insertQuery, [insertData]);

      console.log(`🆕 Created ${insertData.length} new ${table} codes`);
    }

    return codeMap;
  } catch (err) {
    console.error(`Bulk ${table} lookup error:`, err);
    return {};
  }
}

/**
 * Bulk process reference codes for all farmers at once
 */
const bulkProcessReferenceCodes = async (farmers) => {
  console.time("⏱️ Reference codes processing");

  try {
    const provinces = [
      ...new Set(farmers.map((f) => f.province).filter(Boolean)),
    ];
    const districts = [
      ...new Set(farmers.map((f) => f.amphur).filter(Boolean)),
    ];
    const subdistricts = [
      ...new Set(farmers.map((f) => f.tambon).filter(Boolean)),
    ];

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

    console.timeEnd("⏱️ Reference codes processing");
    return { provinceCodes, districtCodes, subdistrictCodes };
  } catch (error) {
    console.error("❌ Error in bulkProcessReferenceCodes:", error);
    console.timeEnd("⏱️ Reference codes processing");
    return { provinceCodes: {}, districtCodes: {}, subdistrictCodes: {} };
  }
};

/**
 * Bulk insert or update farmers using INSERT ... ON DUPLICATE KEY UPDATE
 * @param {Array} farmers - Array of farmer objects
 * @returns {Promise<object>} - Bulk operation result
 */
export async function bulkInsertOrUpdateFarmers(farmers) {
  const bangkokTime = getBangkokTime();

  const processedFarmers = farmers.map((farmer) => [
    farmer.recId,
    farmer.province,
    farmer.amphur,
    farmer.tambon,
    farmer.farmerId,
    farmer.title || null,
    farmer.firstName,
    farmer.lastName,
    farmer.gender || null,
    farmer.dateOfBirth || null,
    farmer.idCard,
    farmer.idCardExpiryDate || null,
    farmer.addr || null,
    farmer.postCode,
    farmer.email || null,
    farmer.mobileNo,
    farmer.lineId || null,
    farmer.farmerRegistNumber || null,
    farmer.farmerRegistType || null,
    farmer.companyId,
    farmer.createdTime,
    farmer.updatedTime,
    bangkokTime,
  ]);

  const query = `
    INSERT INTO farmers (
      rec_id, province, district, subdistrict, 
      farmer_id, title, first_name, last_name, gender, date_of_birth, id_card, 
      id_card_expiry_date, address, post_code, email, mobile_no, line_id, 
      farmer_regist_number, farmer_regist_type, company_id, created_at, updated_at, fetch_at
    ) VALUES ? 
    ON DUPLICATE KEY UPDATE
      province = VALUES(province),
      district = VALUES(district),
      subdistrict = VALUES(subdistrict),
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

  return {
    inserted: result.affectedRows,
    updated: 0,
    errors: 0,
    totalAfter: processedFarmers.length,
  };
}

export { bulkProcessReferenceCodes };
