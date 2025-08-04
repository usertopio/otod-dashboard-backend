const { connectionDB } = require("../../config/db/db.conf.js");
const { OPERATIONS } = require("../../utils/constants");

// 🆕 NEW: Add insertOrUpdateCommunity function (like farmers)
// 🔧 FIXED: Correct the INSERT statement - you have 11 values but 12 placeholders
const insertOrUpdateCommunity = async (community) => {
  try {
    // Check if community already exists
    const [existing] = await connectionDB
      .promise()
      .query(`SELECT id FROM communities WHERE rec_id = ? LIMIT 1`, [
        community.recId,
      ]);

    if (existing.length > 0) {
      // 🔧 UPDATE: Convert names to codes and update
      const convertedCommunity = await convertNamesToCodes(community);

      await connectionDB.promise().query(
        `UPDATE communities SET 
         community_province_code = ?, 
         community_district_code = ?, 
         community_subdistrict_code = ?, 
         post_code = ?, 
         comm_id = ?, 
         comm_name = ?, 
         total_members = ?, 
         no_of_rais = ?, 
         no_of_trees = ?, 
         forecast_yield = ?, 
         updated_at = NOW(),
         fetch_at = NOW()
         WHERE rec_id = ?`,
        [
          convertedCommunity.provinceCode,
          convertedCommunity.districtCode,
          convertedCommunity.subdistrictCode,
          community.postCode || null,
          community.commId,
          community.commName || null,
          community.totalMembers || null,
          community.noOfRais || null,
          community.noOfTrees || null,
          community.forecastYield || null,
          community.recId,
        ]
      );

      return { operation: OPERATIONS.UPDATE, recId: community.recId };
    } else {
      // 🔧 INSERT: Fixed VALUES count to match columns
      const convertedCommunity = await convertNamesToCodes(community);

      await connectionDB.promise().query(
        `INSERT INTO communities 
         (rec_id, community_province_code, community_district_code, 
          community_subdistrict_code, post_code, comm_id, comm_name, 
          total_members, no_of_rais, no_of_trees, forecast_yield, 
          created_at, updated_at, fetch_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
        [
          community.recId, // 1
          convertedCommunity.provinceCode, // 2
          convertedCommunity.districtCode, // 3
          convertedCommunity.subdistrictCode, // 4
          community.postCode || null, // 5
          community.commId, // 6
          community.commName || null, // 7
          community.totalMembers || null, // 8
          community.noOfRais || null, // 9
          community.noOfTrees || null, // 10
          community.forecastYield || null, // 11
          // NOW(), NOW(), NOW() = 3 more values for created_at, updated_at, fetch_at
        ]
      );

      return { operation: OPERATIONS.INSERT, recId: community.recId };
    }
  } catch (err) {
    console.error("Community insert/update error:", err);
    return {
      operation: OPERATIONS.ERROR,
      recId: community.recId,
      error: err.message,
    };
  }
};

// 🔧 HELPER: Convert province/district/subdistrict names to codes
const convertNamesToCodes = async (community) => {
  let provinceCode = null;
  if (community.province) {
    try {
      const [provinceResult] = await connectionDB
        .promise()
        .query(
          `SELECT province_code FROM ref_provinces WHERE province_name_th = ? LIMIT 1`,
          [community.province]
        );
      provinceCode =
        provinceResult.length > 0 ? provinceResult[0].province_code : null;
    } catch (err) {
      console.error("Province lookup error:", err.message);
    }
  }

  // 🔧 FIXED: Add the missing district lookup code
  let districtCode = null;
  if (community.amphur && provinceCode) {
    try {
      const [districtResult] = await connectionDB.promise().query(
        `SELECT district_code FROM ref_districts 
         WHERE district_name_th = ? AND province_code = ? LIMIT 1`,
        [community.amphur, provinceCode]
      );
      districtCode =
        districtResult.length > 0 ? districtResult[0].district_code : null;
    } catch (err) {
      console.error("District lookup error:", err.message);
    }
  }

  // 🔧 FIXED: Add the missing subdistrict lookup code
  let subdistrictCode = null;
  if (community.tambon && districtCode) {
    try {
      const [subdistrictResult] = await connectionDB.promise().query(
        `SELECT subdistrict_code FROM ref_subdistricts 
         WHERE subdistrict_name_th = ? AND district_code = ? LIMIT 1`,
        [community.tambon, districtCode]
      );
      subdistrictCode =
        subdistrictResult.length > 0
          ? subdistrictResult[0].subdistrict_code
          : null;
    } catch (err) {
      console.error("Subdistrict lookup error:", err.message);
    }
  }

  return {
    provinceCode,
    districtCode,
    subdistrictCode,
  };
};

module.exports = {
  insertOrUpdateCommunity, // 🆕 Export new function
};
