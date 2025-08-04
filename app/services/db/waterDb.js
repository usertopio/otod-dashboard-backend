const { connectionDB } = require("../../config/db/water.conf.js");
const { OPERATIONS } = require("../../utils/constants");

// 🔧 Reference lookup function for province codes
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

// 🎯 Advanced insert/update pattern for fetchWater
const insertOrUpdateWater = async (water) => {
  try {
    // Convert province name to code
    const provinceCode = await convertProvinceNameToCode(water.provinceName);

    // Check if water record already exists based on unique combination
    const [existing] = await connectionDB.promise().query(
      `SELECT id FROM water 
         WHERE crop_year = ? AND water_province_code = ? AND oper_month = ? 
         LIMIT 1`,
      [water.cropYear, provinceCode, water.operMonth]
    );

    if (existing.length > 0) {
      // UPDATE existing water record
      await connectionDB.promise().query(
        `UPDATE water SET 
         total_litre = ?, 
         fetch_at = NOW()
         WHERE crop_year = ? AND water_province_code = ? AND oper_month = ?`,
        [water.totalLitre || 0, water.cropYear, provinceCode, water.operMonth]
      );

      return {
        operation: OPERATIONS.UPDATE,
        water: `${water.provinceName}-${water.operMonth}`,
      };
    } else {
      // INSERT new water record
      await connectionDB.promise().query(
        `INSERT INTO water 
         (crop_year, water_province_code, oper_month, total_litre, fetch_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [water.cropYear, provinceCode, water.operMonth, water.totalLitre || 0]
      );

      return {
        operation: OPERATIONS.INSERT,
        water: `${water.provinceName}-${water.operMonth}`,
      };
    }
  } catch (err) {
    console.error("Water insert/update error:", err);
    return {
      operation: OPERATIONS.ERROR,
      water: `${water.provinceName}-${water.operMonth}`,
      error: err.message,
    };
  }
};

module.exports = {
  insertOrUpdateWater,
};
