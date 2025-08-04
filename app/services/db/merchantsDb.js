const { connectionDB } = require("../../config/db/merchants.conf.js");
const { OPERATIONS } = require("../../utils/constants");

// 🔧 Reference lookup functions for location codes
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

const convertDistrictNameToCode = async (districtName) => {
  if (!districtName) return null;

  try {
    const [existing] = await connectionDB
      .promise()
      .query(
        `SELECT district_code FROM ref_districts WHERE district_name_th = ? LIMIT 1`,
        [districtName]
      );

    if (existing.length > 0) {
      return existing[0].district_code;
    } else {
      const [maxResult] = await connectionDB
        .promise()
        .query(
          `SELECT district_code FROM ref_districts ORDER BY district_code DESC LIMIT 1`
        );

      let newDistrictCode;
      if (maxResult.length > 0) {
        const lastCode = maxResult[0].district_code;
        const lastNumber = parseInt(lastCode.replace("D", ""));
        newDistrictCode = `D${String(lastNumber + 1).padStart(3, "0")}`;
      } else {
        newDistrictCode = "D001";
      }

      await connectionDB.promise().query(
        `INSERT INTO ref_districts (district_code, district_name_th, source) 
         VALUES (?, ?, 'generated')`,
        [newDistrictCode, districtName]
      );

      console.log(
        `🆕 Created new district: ${newDistrictCode} = "${districtName}"`
      );
      return newDistrictCode;
    }
  } catch (err) {
    console.error("District lookup error:", err.message);
    return null;
  }
};

const convertSubdistrictNameToCode = async (subdistrictName) => {
  if (!subdistrictName) return null;

  try {
    const [existing] = await connectionDB
      .promise()
      .query(
        `SELECT subdistrict_code FROM ref_subdistricts WHERE subdistrict_name_th = ? LIMIT 1`,
        [subdistrictName]
      );

    if (existing.length > 0) {
      return existing[0].subdistrict_code;
    } else {
      const [maxResult] = await connectionDB
        .promise()
        .query(
          `SELECT subdistrict_code FROM ref_subdistricts ORDER BY subdistrict_code DESC LIMIT 1`
        );

      let newSubdistrictCode;
      if (maxResult.length > 0) {
        const lastCode = maxResult[0].subdistrict_code;
        const lastNumber = parseInt(lastCode.replace("SD", ""));
        newSubdistrictCode = `SD${String(lastNumber + 1).padStart(3, "0")}`;
      } else {
        newSubdistrictCode = "SD001";
      }

      await connectionDB.promise().query(
        `INSERT INTO ref_subdistricts (subdistrict_code, subdistrict_name_th, source) 
         VALUES (?, ?, 'generated')`,
        [newSubdistrictCode, subdistrictName]
      );

      console.log(
        `🆕 Created new subdistrict: ${newSubdistrictCode} = "${subdistrictName}"`
      );
      return newSubdistrictCode;
    }
  } catch (err) {
    console.error("Subdistrict lookup error:", err.message);
    return null;
  }
};

// 🎯 ONLY: Advanced insert/update pattern for fetchMerchantsUntilTarget
const insertOrUpdateMerchant = async (merchant) => {
  try {
    // Check if merchant already exists
    const [existing] = await connectionDB
      .promise()
      .query(`SELECT id FROM merchants WHERE rec_id = ? LIMIT 1`, [
        merchant.recId,
      ]);

    // Convert location names to codes
    const provinceCode = await convertProvinceNameToCode(merchant.province);
    const districtCode = await convertDistrictNameToCode(merchant.amphur);
    const subdistrictCode = await convertSubdistrictNameToCode(merchant.tambon);

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
         updated_at = NOW(),
         fetch_at = NOW()
         WHERE rec_id = ?`,
        [
          provinceCode,
          districtCode,
          subdistrictCode,
          merchant.postCode || null,
          merchant.merchantId,
          merchant.merchantName || null,
          merchant.addr || null,
          merchant.recId,
        ]
      );

      return { operation: OPERATIONS.UPDATE, recId: merchant.recId };
    } else {
      // INSERT new merchant
      await connectionDB.promise().query(
        `INSERT INTO merchants 
         (rec_id, merchant_province_code, merchant_district_code, 
          merchant_subdistrict_code, post_code, merchant_id, merchant_name, 
          address, created_at, updated_at, fetch_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
        [
          merchant.recId,
          provinceCode,
          districtCode,
          subdistrictCode,
          merchant.postCode || null,
          merchant.merchantId,
          merchant.merchantName || null,
          merchant.addr || null,
        ]
      );

      return { operation: OPERATIONS.INSERT, recId: merchant.recId };
    }
  } catch (err) {
    console.error("Merchant insert/update error:", err);
    return {
      operation: OPERATIONS.ERROR,
      recId: merchant.recId,
      error: err.message,
    };
  }
};

module.exports = {
  insertOrUpdateMerchant,
};
