const { connectionDB } = require("../../config/db/db.conf.js");
const { OPERATIONS } = require("../../utils/constants");

// 🔧 ADD: Copy ensureRefCode function from farmersDb.js
async function ensureRefCode(
  table,
  nameColumn,
  codeColumn,
  name,
  generatedCodePrefix
) {
  if (!name) return null;

  try {
    const [existing] = await connectionDB
      .promise()
      .query(
        `SELECT ${codeColumn} FROM ${table} WHERE ${nameColumn} = ? LIMIT 1`,
        [name]
      );

    if (existing.length > 0) {
      return existing[0][codeColumn];
    } else {
      const [maxResult] = await connectionDB
        .promise()
        .query(
          `SELECT ${codeColumn} FROM ${table} ORDER BY ${codeColumn} DESC LIMIT 1`
        );

      let newCode;
      if (maxResult.length > 0) {
        const lastCode = maxResult[0][codeColumn];
        const lastNumber = parseInt(lastCode.replace(generatedCodePrefix, ""));
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
    }
  } catch (err) {
    console.error(`${table} lookup error:`, err.message);
    return null;
  }
}

const insertOrUpdateMerchant = async (merchant) => {
  try {
    // 🔧 REPLACE: Use ensureRefCode like farmers
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

    // Check if merchant already exists
    const [existing] = await connectionDB
      .promise()
      .query(`SELECT id FROM merchants WHERE rec_id = ? LIMIT 1`, [
        merchant.recId,
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
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
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
