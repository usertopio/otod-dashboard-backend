// db/merchantsDb.js (ESM)

// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";
import { OPERATIONS } from "../../utils/constants.js";

// ===================== DB Utilities =====================
// Provides helper functions for reference code lookup and upserting merchants

/**
 * Ensures a reference code exists in the table, inserts if not found.
 * @param {string} table - Reference table name.
 * @param {string} nameColumn - Column for the name.
 * @param {string} codeColumn - Column for the code.
 * @param {string} name - Name to look up or insert.
 * @param {string} generatedCodePrefix - Prefix for generated codes.
 * @returns {Promise<string|null>} - The code.
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
    }

    // Generate new code if not found
    const [maxResult] = await connectionDB
      .promise()
      .query(
        `SELECT ${codeColumn} FROM ${table} ORDER BY ${codeColumn} DESC LIMIT 1`
      );

    let newCode;
    if (maxResult.length > 0) {
      const lastCode = maxResult[0][codeColumn];
      const lastNumber = parseInt(
        String(lastCode).replace(generatedCodePrefix, ""),
        10
      );
      newCode = `${generatedCodePrefix}${String(lastNumber + 1).padStart(
        3,
        "0"
      )}`;
    } else {
      newCode = `${generatedCodePrefix}001`;
    }

    await connectionDB.promise().query(
      `INSERT INTO ${table} (${codeColumn}, ${nameColumn}, source) 
         VALUES (?, ?, 'generated')`,
      [newCode, name]
    );

    console.log(`🆕 Created new ${table}: ${newCode} = "${name}"`);
    return newCode;
  } catch (err) {
    console.error(`${table} lookup error:`, err.message);
    return null;
  }
}

/**
 * Inserts or updates a merchant record in the database.
 * Maps reference codes, checks for existence, and upserts accordingly.
 * @param {object} merchant - Merchant data object.
 * @returns {Promise<object>} - Operation result.
 */
export async function insertOrUpdateMerchant(merchant) {
  try {
    // Map province, district, subdistrict to codes
    const provinceCode = await ensureRefCode(
      "ref_provinces",
      "province_name_th",
      "province_code",
      merchant.province,
      "GPROV"
    );

    const districtCode = await ensureRefCode(
      "ref_districts",
      "district_name_th",
      "district_code",
      merchant.amphur,
      "GDIST"
    );

    const subdistrictCode = await ensureRefCode(
      "ref_subdistricts",
      "subdistrict_name_th",
      "subdistrict_code",
      merchant.tambon,
      "GSUBDIST"
    );

    // === Prepare values ===
    const values = {
      rec_id: merchant.recId,
      merchant_province_code: provinceCode,
      merchant_district_code: districtCode,
      merchant_subdistrict_code: subdistrictCode,
      post_code: merchant.postCode || null,
      merchant_id: merchant.merchantId,
      merchant_name: merchant.merchantName || null,
      address: merchant.addr || null,
      created_at: merchant.createdTime || null,
      updated_at: merchant.updatedTime || null,
      fetch_at: new Date(),
    };

    // Check if merchant already exists
    const [existing] = await connectionDB
      .promise()
      .query(`SELECT id FROM merchants WHERE rec_id = ? LIMIT 1`, [
        values.rec_id,
      ]);

    if (existing.length > 0) {
      // UPDATE existing merchant
      await connectionDB.promise().query(
        `UPDATE merchants SET 
             merchant_province_code = ?, 
             merchant_district_code = ?, 
             merchant_subdistrict_code = ?, 
             post_code = ?, 
             merchant_id = ?, 
             merchant_name = ?, 
             address = ?, 
             updated_at = ?, 
             fetch_at = ?
           WHERE rec_id = ?`,
        [
          values.merchant_province_code,
          values.merchant_district_code,
          values.merchant_subdistrict_code,
          values.post_code,
          values.merchant_id,
          values.merchant_name,
          values.address,
          values.updated_at,
          values.fetch_at,
          values.rec_id,
        ]
      );

      return { operation: OPERATIONS.UPDATE, recId: values.rec_id };
    }

    // INSERT new merchant
    await connectionDB.promise().query(
      `INSERT INTO merchants 
           (rec_id, merchant_province_code, merchant_district_code, 
            merchant_subdistrict_code, post_code, merchant_id, merchant_name, 
            address, created_at, updated_at, fetch_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        values.rec_id,
        values.merchant_province_code,
        values.merchant_district_code,
        values.merchant_subdistrict_code,
        values.post_code,
        values.merchant_id,
        values.merchant_name,
        values.address,
        values.created_at,
        values.updated_at,
        values.fetch_at,
      ]
    );

    return { operation: OPERATIONS.INSERT, recId: values.rec_id };
  } catch (err) {
    console.error("Merchant insert/update error:", err);
    return {
      operation: OPERATIONS.ERROR,
      recId: merchant.recId,
      error: err.message,
    };
  }
}
