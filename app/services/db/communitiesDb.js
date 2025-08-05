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
      // Generate new code if not found
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

const insertOrUpdateCommunity = async (community) => {
  try {
    // 🔧 REPLACE: Use ensureRefCode like farmers
    const provinceCode = await ensureRefCode(
      "ref_provinces",
      "province_name_th",
      "province_code",
      community.province,
      "GPROV"
    );

    const districtCode = await ensureRefCode(
      "ref_districts",
      "district_name_th",
      "district_code",
      community.amphur,
      "GDIST"
    );

    const subdistrictCode = await ensureRefCode(
      "ref_subdistricts",
      "subdistrict_name_th",
      "subdistrict_code",
      community.tambon,
      "GSUBDIST"
    );

    // Check if community already exists
    const [existing] = await connectionDB
      .promise()
      .query(`SELECT id FROM communities WHERE rec_id = ? LIMIT 1`, [
        community.recId,
      ]);

    if (existing.length > 0) {
      // UPDATE existing community
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
          provinceCode,
          districtCode,
          subdistrictCode,
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
      // INSERT new community
      await connectionDB.promise().query(
        `INSERT INTO communities 
         (rec_id, community_province_code, community_district_code, 
          community_subdistrict_code, post_code, comm_id, comm_name, 
          total_members, no_of_rais, no_of_trees, forecast_yield, 
          created_at, updated_at, fetch_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
        [
          community.recId,
          provinceCode,
          districtCode,
          subdistrictCode,
          community.postCode || null,
          community.commId,
          community.commName || null,
          community.totalMembers || null,
          community.noOfRais || null,
          community.noOfTrees || null,
          community.forecastYield || null,
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

module.exports = {
  insertOrUpdateCommunity,
};
