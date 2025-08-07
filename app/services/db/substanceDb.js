// ===================== Imports =====================
// Import DB connection for executing SQL queries
const { connectionDB } = require("../../config/db/db.conf.js");
const { OPERATIONS } = require("../../utils/constants");

// ===================== Reference Lookup =====================
/**
 * Looks up or generates a province code for a given province name.
 * @param {string} provinceName - Province name in Thai.
 * @returns {Promise<string|null>} - Province code.
 */
const convertProvinceNameToCode = async (provinceName) => {
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
    } else {
      const [maxResult] = await connectionDB
        .promise()
        .query(
          `SELECT province_code FROM ref_provinces ORDER BY province_code DESC LIMIT 1`
        );

      let newProvinceCode;
      if (maxResult.length > 0) {
        const lastCode = maxResult[0].province_code;
        const lastNumber = parseInt(lastCode.replace("P", ""));
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
    }
  } catch (err) {
    console.error("Province lookup error:", err.message);
    return null;
  }
};

// ===================== Insert/Update =====================
/**
 * Inserts or updates a substance usage summary record in the database.
 * Maps province name to code, checks for existence, and upserts accordingly.
 * @param {object} substance - Substance usage summary data object.
 * @returns {Promise<object>} - Operation result.
 */
const insertOrUpdateSubstance = async (substance) => {
  try {
    // Convert province name to code
    const provinceCode = await convertProvinceNameToCode(
      substance.provinceName
    );

    // Check if substance record already exists based on unique combination
    const [existing] = await connectionDB.promise().query(
      `SELECT id FROM substance 
         WHERE crop_year = ? AND province_code = ? AND substance = ? 
         AND oper_month = STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d')
         LIMIT 1`,
      [
        substance.cropYear,
        provinceCode,
        substance.substance,
        substance.operMonth,
      ]
    );

    if (existing.length > 0) {
      // UPDATE existing substance record
      await connectionDB.promise().query(
        `UPDATE substance SET 
         total_records = ?, 
         fetch_at = NOW()
         WHERE crop_year = ? AND province_code = ? AND substance = ? 
         AND oper_month = STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d')`,
        [
          substance.totalRecords || 0,
          substance.cropYear,
          provinceCode,
          substance.substance,
          substance.operMonth,
        ]
      );

      return { operation: OPERATIONS.UPDATE, substance: substance.substance };
    } else {
      // INSERT new substance record
      await connectionDB.promise().query(
        `INSERT INTO substance 
         (crop_year, province_code, substance, oper_month, total_records, fetch_at) 
         VALUES (?, ?, ?, STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d'), ?, NOW())`,
        [
          substance.cropYear,
          provinceCode,
          substance.substance,
          substance.operMonth,
          substance.totalRecords || 0,
        ]
      );

      return { operation: OPERATIONS.INSERT, substance: substance.substance };
    }
  } catch (err) {
    console.error("Substance insert/update error:", err);
    return {
      operation: OPERATIONS.ERROR,
      substance: substance.substance,
      error: err.message,
    };
  }
};

// ===================== Exports =====================
module.exports = {
  insertOrUpdateSubstance,
};
