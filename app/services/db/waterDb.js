// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";
import { OPERATIONS } from "../../utils/constants.js";

// ===================== Reference Lookup =====================
/**
 * Looks up or generates a province code for a given province name.
 * @param {string} provinceName - Province name in Thai.
 * @returns {Promise<string|null>} - Province code.
 */
async function convertProvinceNameToCode(provinceName) {
  if (!provinceName) return null;

  try {
    const [existing] = await connectionDB
      .promise()
      .query(
        `SELECT province_code FROM ref_provinces WHERE province_name_th = ? LIMIT 1`,
        [provinceName]
      );

    if (existing.length > 0) {
      return existing[0].province_code;
    }

    const [maxResult] = await connectionDB
      .promise()
      .query(
        `SELECT province_code FROM ref_provinces ORDER BY province_code DESC LIMIT 1`
      );

    let newProvinceCode;
    if (maxResult.length > 0) {
      const lastCode = maxResult[0].province_code;
      const lastNumber = parseInt(String(lastCode).replace("P", ""), 10) || 0;
      newProvinceCode = `P${String(lastNumber + 1).padStart(3, "0")}`;
    } else {
      newProvinceCode = "P001";
    }

    await connectionDB.promise().query(
      `INSERT INTO ref_provinces (province_code, province_name_th, source) 
         VALUES (?, ?, 'generated')`,
      [newProvinceCode, provinceName]
    );

    console.log(
      `🆕 Created new province: ${newProvinceCode} = "${provinceName}"`
    );
    return newProvinceCode;
  } catch (err) {
    console.error("Province lookup error:", err.message);
    return null;
  }
}

// ===================== Insert/Update =====================
/**
 * Inserts or updates a water usage summary record in the database.
 * Maps province name to code, checks for existence, and upserts accordingly.
 * @param {object} water - Water usage summary data object.
 * @returns {Promise<object>} - Operation result.
 */
export async function insertOrUpdateWater(water) {
  try {
    // Convert province name to code
    const provinceCode = await convertProvinceNameToCode(water.provinceName);

    // Check if water record already exists - ADD STR_TO_DATE
    const [existing] = await connectionDB.promise().query(
      `SELECT id FROM water 
           WHERE crop_year = ? AND water_province_code = ? 
             AND oper_month = STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d')
           LIMIT 1`,
      [water.cropYear, provinceCode, water.operMonth]
    );

    if (existing.length > 0) {
      // UPDATE existing water record
      await connectionDB.promise().query(
        `UPDATE water SET 
             total_litre = ?, 
             fetch_at = NOW()
           WHERE crop_year = ? AND water_province_code = ? 
             AND oper_month = STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d')`,
        [water.totalLitre || 0, water.cropYear, provinceCode, water.operMonth]
      );

      return {
        operation: OPERATIONS.UPDATE,
        water: `${water.provinceName}-${water.operMonth}`,
      };
    }

    // INSERT new water record
    await connectionDB.promise().query(
      `INSERT INTO water 
           (crop_year, water_province_code, oper_month, total_litre, fetch_at) 
         VALUES (?, ?, STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d'), ?, NOW())`,
      [water.cropYear, provinceCode, water.operMonth, water.totalLitre || 0]
    );

    return {
      operation: OPERATIONS.INSERT,
      water: `${water.provinceName}-${water.operMonth}`,
    };
  } catch (err) {
    console.error("Water insert/update error:", err);
    return {
      operation: OPERATIONS.ERROR,
      water: `${water.provinceName}-${water.operMonth}`,
      error: err.message,
    };
  }
}
