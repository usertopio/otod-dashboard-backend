// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";
import { OPERATIONS } from "../../utils/constants.js";

/**
 * Bulk ensure reference codes for a list of names
 */
async function bulkEnsureRefCodes(
  table,
  nameColumn,
  codeColumn,
  names,
  prefix
) {
  if (!names || names.length === 0) {
    return new Map();
  }

  try {
    // Get existing codes
    const placeholders = names.map(() => "?").join(",");
    const selectQuery = `SELECT ${nameColumn}, ${codeColumn} FROM ${table} WHERE ${nameColumn} IN (${placeholders})`;
    const [existing] = await connectionDB.promise().query(selectQuery, names);

    const codeMap = new Map();
    const existingNames = new Set();

    existing.forEach((row) => {
      codeMap.set(row[nameColumn], row[codeColumn]);
      existingNames.add(row[nameColumn]);
    });

    // Find missing names
    const missingNames = names.filter((name) => !existingNames.has(name));

    if (missingNames.length > 0) {
      // Get next available code number
      const maxQuery = `SELECT MAX(CAST(SUBSTRING(${codeColumn}, ${
        prefix.length + 1
      }) AS UNSIGNED)) as maxNum FROM ${table} WHERE ${codeColumn} LIKE '${prefix}%'`;
      const [maxResult] = await connectionDB.promise().query(maxQuery);
      let nextNum = (maxResult[0]?.maxNum || 0) + 1;

      // Insert missing codes
      const insertData = missingNames.map((name) => {
        const newCode = `${prefix}${nextNum.toString().padStart(3, "0")}`;
        codeMap.set(name, newCode);
        nextNum++;
        return [newCode, name];
      });

      const insertQuery = `INSERT INTO ${table} (${codeColumn}, ${nameColumn}) VALUES ?`;
      await connectionDB.promise().query(insertQuery, [insertData]);

      console.log(`🆕 Created ${insertData.length} new ${table} codes`);
    }

    return codeMap;
  } catch (err) {
    console.error(`Bulk ${table} lookup error:`, err);
    return new Map();
  }
}

/**
 * Bulk process reference codes for all communities at once
 */
async function bulkProcessReferenceCodes(communities) {
  // Get unique values
  const provinces = [
    ...new Set(communities.map((c) => c.province).filter(Boolean)),
  ];
  const districts = [
    ...new Set(communities.map((c) => c.district).filter(Boolean)),
  ];
  const subdistricts = [
    ...new Set(communities.map((c) => c.subdistrict).filter(Boolean)),
  ];

  // Bulk lookup/create all reference codes
  const [provinceCodes, districtCodes, subdistrictCodes] = await Promise.all([
    bulkEnsureRefCodes(
      "ref_provinces",
      "province_name_th",
      "province_code",
      provinces,
      "GPROV"
    ),
    bulkEnsureRefCodes(
      "ref_districts",
      "district_name",
      "district_code",
      districts,
      "GDIST"
    ),
    bulkEnsureRefCodes(
      "ref_subdistricts",
      "subdistrict_name",
      "subdistrict_code",
      subdistricts,
      "GSUBDIST"
    ),
  ]);

  return { provinceCodes, districtCodes, subdistrictCodes };
}

/**
 * Bulk insert or update communities using INSERT ... ON DUPLICATE KEY UPDATE
 * @param {Array} communities - Array of community objects
 * @returns {Promise<object>} - Bulk operation result
 */
export async function bulkInsertOrUpdateCommunities(communities) {
  if (!communities || communities.length === 0) {
    return { inserted: 0, updated: 0, errors: 0 };
  }

  try {
    console.time("⏱️ Reference codes processing");

    // BULK process all reference codes at once
    const { provinceCodes, districtCodes, subdistrictCodes } =
      await bulkProcessReferenceCodes(communities);

    console.timeEnd("⏱️ Reference codes processing");
    console.time("⏱️ Data preparation");

    // Get current count before operation
    const [countBefore] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM communities");
    const beforeCount = countBefore[0].count;

    // ✅ FIXED: Prepare community data matching actual schema
    const communityData = communities.map((community) => [
      community.recId, // rec_id
      provinceCodes.get(community.province) || null, // community_province_code
      districtCodes.get(community.district) || null, // community_district_code
      subdistrictCodes.get(community.subdistrict) || null, // community_subdistrict_code
      community.postCode || null, // post_code
      community.commId || community.communityId || null, // comm_id
      community.communityName || community.commName || null, // comm_name
      community.totalMembers || null, // total_members
      community.noOfRais || null, // no_of_rais
      community.noOfTrees || null, // no_of_trees
      community.forecastYield || null, // forecast_yield
      community.createdTime || community.createdAt, // created_at
      community.updatedTime || community.updatedAt, // updated_at
      new Date(), // fetch_at
    ]);

    console.timeEnd("⏱️ Data preparation");
    console.time("⏱️ Bulk database operation");

    // ✅ FIXED: SQL query matching actual table schema
    const insertQuery = `
      INSERT INTO communities (
        rec_id, community_province_code, community_district_code, community_subdistrict_code,
        post_code, comm_id, comm_name, total_members, no_of_rais, no_of_trees,
        forecast_yield, created_at, updated_at, fetch_at
      ) VALUES ? 
      ON DUPLICATE KEY UPDATE
        community_province_code = VALUES(community_province_code),
        community_district_code = VALUES(community_district_code),
        community_subdistrict_code = VALUES(community_subdistrict_code),
        post_code = VALUES(post_code),
        comm_id = VALUES(comm_id),
        comm_name = VALUES(comm_name),
        total_members = VALUES(total_members),
        no_of_rais = VALUES(no_of_rais),
        no_of_trees = VALUES(no_of_trees),
        forecast_yield = VALUES(forecast_yield),
        created_at = VALUES(created_at),
        updated_at = VALUES(updated_at),
        fetch_at = VALUES(fetch_at)
    `;

    // Execute bulk operation
    const [result] = await connectionDB
      .promise()
      .query(insertQuery, [communityData]);

    console.timeEnd("⏱️ Bulk database operation");

    // Get count after operation
    const [countAfter] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM communities");
    const afterCount = countAfter[0].count;

    // Calculate actual inserts and updates
    const actualInserts = afterCount - beforeCount;
    const actualUpdates = communities.length - actualInserts;

    console.log(
      `📊 Bulk operation: ${actualInserts} inserted, ${actualUpdates} updated`
    );
    console.log(
      `📊 Database: ${beforeCount} → ${afterCount} (${
        actualInserts > 0 ? "+" + actualInserts : "no change"
      })`
    );

    return {
      operation: "BULK_UPSERT",
      inserted: actualInserts,
      updated: Math.max(0, actualUpdates),
      errors: 0,
      totalProcessed: communities.length,
    };
  } catch (err) {
    console.error("Bulk community insert/update error:", err);
    return {
      operation: "BULK_ERROR",
      inserted: 0,
      updated: 0,
      errors: communities.length,
      totalProcessed: communities.length,
    };
  }
}

// Keep existing individual function for compatibility
export async function insertOrUpdateCommunity(community) {
  // ...existing individual processing code if needed...
}
