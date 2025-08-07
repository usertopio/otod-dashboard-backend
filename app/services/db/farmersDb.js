// ===================== Imports =====================
// Import DB connection for executing SQL queries
const { connectionDB } = require("../../config/db/db.conf.js");

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
  let code = await getRefCode(table, nameColumn, codeColumn, name);
  if (!code) {
    code = `${generatedCodePrefix}${Date.now()}`;
    await connectionDB
      .promise()
      .query(
        `INSERT INTO ${table} (${codeColumn}, ${nameColumn}, source) VALUES (?, ?, 'generated')`,
        [code, name]
      );
  }
  return code;
}

/**
 * Inserts or updates a farmer record in the database.
 * Maps reference codes, checks for existence, and upserts accordingly.
 * @param {object} farmer - Farmer data object.
 * @returns {Promise<object>} - Operation result.
 */
async function insertOrUpdateFarmer(farmer) {
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
      const updateFields = Object.keys(values)
        .filter((key) => key !== "rec_id")
        .map((key) => `${key} = ?`)
        .join(", ");

      await connectionDB
        .promise()
        .query(`UPDATE farmers SET ${updateFields} WHERE rec_id = ?`, [
          ...Object.values(values).filter(
            (_, i) => Object.keys(values)[i] !== "rec_id"
          ),
          values.rec_id,
        ]);

      return { operation: "UPDATE", recId: farmer.recId };
    } else {
      // === Insert new record ===
      await connectionDB.promise().query(
        `INSERT INTO farmers (${Object.keys(values).join(
          ", "
        )}) VALUES (${Object.keys(values)
          .map(() => "?")
          .join(", ")})`,
        Object.values(values)
      );

      return { operation: "INSERT", recId: farmer.recId };
    }
  } catch (err) {
    // Log and return error operation
    console.error("Farmer insert/update error:", err);
    return { operation: "ERROR", recId: farmer.recId, error: err.message };
  }
}

// ===================== Exports =====================
module.exports = { insertOrUpdateFarmer };
