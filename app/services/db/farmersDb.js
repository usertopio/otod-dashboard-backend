// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";

// ===================== DB Utilities =====================
// Provides helper functions for reference code lookup and upserting farmers

/**
 * Looks up a reference code in a reference table by name.
 * @param {string} table - Reference table name.
 * @param {string} nameColumn - Column for the name.
 * @param {string} codeColumn - Column for the code.
 * @param {string} name - Name to look up.
 * @returns {Promise<string|null>} - The code if found, else null.
 */
async function getRefCode(table, nameColumn, codeColumn, name) {
  const [rows] = await connectionDB
    .promise()
    .query(
      `SELECT ${codeColumn} FROM ${table} WHERE ${nameColumn} = ? LIMIT 1`,
      [name]
    );
  return rows.length > 0 ? rows[0][codeColumn] : null;
}

/**
 * Standardized ensureRefCode for all modules
 * Ensures a reference code exists in the table, inserts if not found.
 * @param {string} table - Reference table name.
 * @param {string} nameColumn - Column for the name.
 * @param {string} codeColumn - Column for the code.
 * @param {string} name - Name to look up or insert.
 * @param {string} generatedCodePrefix - Prefix for generated codes.
 * @returns {Promise<string>} - The code.
 */
async function ensureRefCode(
  table,
  nameColumn,
  codeColumn,
  name,
  generatedCodePrefix
) {
  if (!name) return null;

  try {
    // Check if name exists in reference table
    const [existing] = await connectionDB
      .promise()
      .query(
        `SELECT ${codeColumn} FROM ${table} WHERE ${nameColumn} = ? LIMIT 1`,
        [name]
      );

    if (existing.length > 0) {
      return existing[0][codeColumn];
    } else {
      // Generate new sequential code if not found
      const [maxResult] = await connectionDB
        .promise()
        .query(
          `SELECT ${codeColumn} FROM ${table} WHERE ${codeColumn} LIKE '${generatedCodePrefix}%' ORDER BY ${codeColumn} DESC LIMIT 1`
        );

      let newCode;
      if (maxResult.length > 0) {
        const lastCode = maxResult[0][codeColumn];
        const lastNumber =
          parseInt(lastCode.replace(generatedCodePrefix, "")) || 0;
        newCode = `${generatedCodePrefix}${String(lastNumber + 1).padStart(
          3,
          "0"
        )}`;
      } else {
        newCode = `${generatedCodePrefix}001`;
      }

      await connectionDB
        .promise()
        .query(
          `INSERT INTO ${table} (${codeColumn}, ${nameColumn}, source) VALUES (?, ?, 'generated')`,
          [newCode, name]
        );

      console.log(`🆕 Created new ${table}: ${newCode} = "${name}"`);
      return newCode;
    }
  } catch (err) {
    console.error(`${table} lookup error:`, err.message);
    return null;
  }
}

/**
 * Inserts or updates a farmer record in the database.
 * Maps reference codes, checks for existence, and upserts accordingly.
 * @param {object} farmer - Farmer data object.
 * @returns {Promise<object>} - Operation result.
 */
export async function insertOrUpdateFarmer(farmer) {
  try {
    // === Map province, district, subdistrict to codes ===
    const provinceCode = await ensureRefCode(
      "ref_provinces",
      "province_name_th",
      "province_code",
      farmer.province,
      "GPROV"
    );

    const districtCode = await ensureRefCode(
      "ref_districts",
      "district_name_th",
      "district_code",
      farmer.amphur,
      "GDIST"
    );

    const subdistrictCode = await ensureRefCode(
      "ref_subdistricts",
      "subdistrict_name_th",
      "subdistrict_code",
      farmer.tambon,
      "GSUBDIST"
    );

    // === Prepare transformed data for DB ===
    const values = {
      rec_id: farmer.recId,
      farmer_province_code: provinceCode,
      farmer_district_code: districtCode,
      farmer_subdistrict_code: subdistrictCode,
      farmer_id: farmer.farmerId,
      title: farmer.title,
      first_name: farmer.firstName,
      last_name: farmer.lastName,
      gender: farmer.gender,
      date_of_birth: farmer.dateOfBirth || null,
      id_card: farmer.idCard,
      id_card_expiry_date: farmer.idCardExpiryDate || null,
      address: farmer.addr,
      post_code: farmer.postCode,
      email: farmer.email,
      mobile_no: farmer.mobileNo,
      line_id: farmer.lineId,
      farmer_regist_number: farmer.farmerRegistNumber,
      farmer_regist_type: farmer.farmerRegistType,
      company_id: farmer.companyId,
      created_at: farmer.createdTime,
      updated_at: farmer.updatedTime,
      fetch_at: new Date(),
    };

    // === Check for existing rec_id ===
    const [existing] = await connectionDB
      .promise()
      .query(`SELECT id FROM farmers WHERE rec_id = ? LIMIT 1`, [
        values.rec_id,
      ]);

    if (existing.length > 0) {
      // === Update existing record ===
      await connectionDB.promise().query(
        `UPDATE farmers SET 
          farmer_province_code = ?, farmer_district_code = ?, farmer_subdistrict_code = ?, 
          farmer_id = ?, title = ?, first_name = ?, last_name = ?, gender = ?, date_of_birth = ?, 
          id_card = ?, id_card_expiry_date = ?, address = ?, post_code = ?, email = ?, mobile_no = ?, 
          line_id = ?, farmer_regist_number = ?, farmer_regist_type = ?, company_id = ?, 
          updated_at = ?, fetch_at = ?
         WHERE rec_id = ?`,
        [
          values.farmer_province_code,
          values.farmer_district_code,
          values.farmer_subdistrict_code,
          values.farmer_id,
          values.title,
          values.first_name,
          values.last_name,
          values.gender,
          values.date_of_birth,
          values.id_card,
          values.id_card_expiry_date,
          values.address,
          values.post_code,
          values.email,
          values.mobile_no,
          values.line_id,
          values.farmer_regist_number,
          values.farmer_regist_type,
          values.company_id,
          values.updated_at,
          values.fetch_at,
          values.rec_id,
        ]
      );

      return { operation: "UPDATE", recId: farmer.recId };
    } else {
      // === Insert new record ===
      await connectionDB.promise().query(
        `INSERT INTO farmers (
          rec_id, farmer_province_code, farmer_district_code, farmer_subdistrict_code, farmer_id, title, 
          first_name, last_name, gender, date_of_birth, id_card, id_card_expiry_date, address, post_code, 
          email, mobile_no, line_id, farmer_regist_number, farmer_regist_type, company_id, created_at, updated_at, fetch_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          values.rec_id,
          values.farmer_province_code,
          values.farmer_district_code,
          values.farmer_subdistrict_code,
          values.farmer_id,
          values.title,
          values.first_name,
          values.last_name,
          values.gender,
          values.date_of_birth,
          values.id_card,
          values.id_card_expiry_date,
          values.address,
          values.post_code,
          values.email,
          values.mobile_no,
          values.line_id,
          values.farmer_regist_number,
          values.farmer_regist_type,
          values.company_id,
          values.created_at,
          values.updated_at,
          values.fetch_at,
        ]
      );

      return { operation: "INSERT", recId: farmer.recId };
    }
  } catch (err) {
    // Log and return error operation
    console.error("Farmer insert/update error:", err);
    return { operation: "ERROR", recId: farmer.recId, error: err.message };
  }
}
