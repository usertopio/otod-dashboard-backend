// app/services/db/locationHelper.js

const { connectionDB } = require("../../config/db/db.conf.js");

/**
 * Helper to get or insert a province based on Thai name
 * @param {string} provinceName
 * @returns {Promise<Object>} { province_code, province_name_th }
 */
async function getOrInsertProvince(provinceName) {
  // Check if the province already exists
  const [rows] = await connectionDB
    .promise()
    .query("SELECT * FROM ref_provinces WHERE province_name_th = ?", [
      provinceName,
    ]);

  if (rows.length > 0) return rows[0];

  // Generate a new province code: G001, G002, etc.
  const [maxRow] = await connectionDB.promise().query(
    `SELECT MAX(CAST(SUBSTRING(province_code, 2) AS UNSIGNED)) AS max_code
     FROM ref_provinces WHERE province_code LIKE 'G%'`
  );

  const nextCode = "G" + String((maxRow[0].max_code || 0) + 1).padStart(3, "0");

  // Insert new province
  await connectionDB
    .promise()
    .query(
      `INSERT INTO ref_provinces (province_code, province_name_th, source) VALUES (?, ?, 'generated')`,
      [nextCode, provinceName]
    );

  return { province_code: nextCode, province_name_th: provinceName };
}

/**
 * Helper to get or insert a district
 * Requires a valid province_code (must be checked/inserted before)
 */
async function getOrInsertDistrict(districtName, provinceCode) {
  const [rows] = await connectionDB
    .promise()
    .query(
      `SELECT * FROM ref_districts WHERE district_name_th = ? AND province_code = ?`,
      [districtName, provinceCode]
    );

  if (rows.length > 0) return rows[0];

  const [maxRow] = await connectionDB.promise().query(
    `SELECT MAX(CAST(SUBSTRING(district_code, 2) AS UNSIGNED)) AS max_code
     FROM ref_districts WHERE district_code LIKE 'G%'`
  );

  const nextCode = "G" + String((maxRow[0].max_code || 0) + 1).padStart(3, "0");

  await connectionDB.promise().query(
    `INSERT INTO ref_districts (district_code, district_name_th, province_code, source)
     VALUES (?, ?, ?, 'generated')`,
    [nextCode, districtName, provinceCode]
  );

  return { district_code: nextCode, district_name_th: districtName };
}

/**
 * Helper to get or insert a subdistrict
 * Requires a valid district_code (must be checked/inserted before)
 */
async function getOrInsertSubdistrict(
  subdistrictName,
  districtCode,
  postCode = null
) {
  const [rows] = await connectionDB
    .promise()
    .query(
      `SELECT * FROM ref_subdistricts WHERE subdistrict_name_th = ? AND district_code = ?`,
      [subdistrictName, districtCode]
    );

  if (rows.length > 0) return rows[0];

  const [maxRow] = await connectionDB.promise().query(
    `SELECT MAX(CAST(SUBSTRING(subdistrict_code, 2) AS UNSIGNED)) AS max_code
     FROM ref_subdistricts WHERE subdistrict_code LIKE 'G%'`
  );

  const nextCode = "G" + String((maxRow[0].max_code || 0) + 1).padStart(3, "0");

  await connectionDB.promise().query(
    `INSERT INTO ref_subdistricts (subdistrict_code, subdistrict_name_th, post_code, district_code, source)
     VALUES (?, ?, ?, ?, 'generated')`,
    [nextCode, subdistrictName, postCode, districtCode]
  );

  return { subdistrict_code: nextCode, subdistrict_name_th: subdistrictName };
}

module.exports = {
  getOrInsertProvince,
  getOrInsertDistrict,
  getOrInsertSubdistrict,
};
