// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";

/**
 * Bulk ensure reference codes for a list of names
 */
export const bulkEnsureRefCodes = async (
  table,
  nameColumn,
  codeColumn,
  names,
  prefix
) => {
  if (!names.length) return new Map();

  try {
    // Get existing codes in one query
    const [existing] = await connectionDB
      .promise()
      .query(
        `SELECT ${nameColumn}, ${codeColumn} FROM ${table} WHERE ${nameColumn} IN (?)`,
        [names]
      );

    const codeMap = new Map();
    existing.forEach((row) => {
      codeMap.set(row[nameColumn], row[codeColumn]);
    });

    // Find missing names
    const missingNames = names.filter((name) => !codeMap.has(name));

    if (missingNames.length > 0) {
      // Generate codes for missing names
      const [maxResult] = await connectionDB
        .promise()
        .query(
          `SELECT ${codeColumn} FROM ${table} WHERE ${codeColumn} LIKE '${prefix}%' ORDER BY ${codeColumn} DESC LIMIT 1`
        );

      let nextNumber = 1;
      if (maxResult.length > 0) {
        const lastCode = maxResult[0][codeColumn];
        nextNumber = parseInt(lastCode.replace(prefix, "")) + 1;
      }

      // Bulk insert missing codes
      const insertData = missingNames.map((name, index) => {
        const code = `${prefix}${String(nextNumber + index).padStart(3, "0")}`;
        codeMap.set(name, code);
        return [code, name, "generated"];
      });

      const insertQuery = `INSERT INTO ${table} (${codeColumn}, ${nameColumn}, source) VALUES ?`;
      await connectionDB.promise().query(insertQuery, [insertData]);

      console.log(`🆕 Created ${insertData.length} new ${table} codes`);
    }

    return codeMap;
  } catch (err) {
    console.error(`Bulk ${table} lookup error:`, err);
    return new Map();
  }
};

/**
 * Processes reference codes in bulk for all communities
 */
export const bulkProcessReferenceCodes = async (communities) => {
  console.time("Reference codes processing");

  try {
    const provinces = [
      ...new Set(communities.map((c) => c.province).filter(Boolean)),
    ];
    const districts = [
      ...new Set(communities.map((c) => c.amphur).filter(Boolean)),
    ];
    const subdistricts = [
      ...new Set(communities.map((c) => c.tambon).filter(Boolean)),
    ];

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
        "district_name_th",
        "district_code",
        districts,
        "GDIST"
      ),
      bulkEnsureRefCodes(
        "ref_subdistricts",
        "subdistrict_name_th",
        "subdistrict_code",
        subdistricts,
        "GSUBDIST"
      ),
    ]);

    console.timeEnd("Reference codes processing");
    return [provinceCodes, districtCodes, subdistrictCodes];
  } catch (error) {
    console.error("❌ Error in bulkProcessReferenceCodes:", error);
    console.timeEnd("Reference codes processing");
    return [new Map(), new Map(), new Map()];
  }
};

/**
 * Bulk insert or update communities in the database
 */
export const bulkInsertOrUpdateCommunities = async (communities) => {
  const connection = connectionDB.promise();

  try {
    const [provinceCodes, districtCodes, subdistrictCodes] =
      await bulkProcessReferenceCodes(communities);

    console.time("Data preparation");

    const communityData = communities.map((community) => [
      community.recId,
      community.postCode,
      community.commId,
      community.commName,
      community.totalMembers,
      community.noOfRais,
      community.noOfTrees,
      community.forecastYield,
      community.createdTime,
      community.updatedTime,
      provinceCodes.get(community.province) || null,
      districtCodes.get(community.amphur) || null,
      subdistrictCodes.get(community.tambon) || null,
    ]);

    console.timeEnd("Data preparation");
    console.time("Bulk database operation");

    const [beforeResult] = await connection.query(
      "SELECT COUNT(*) as count FROM communities"
    );
    const countBefore = beforeResult[0].count;

    const sql = `
      INSERT INTO communities (
        rec_id, post_code, comm_id, comm_name, total_members, no_of_rais, no_of_trees,
        forecast_yield, created_at, updated_at,
        community_province_code, community_district_code, community_subdistrict_code,
        fetch_at
      ) VALUES ?
      ON DUPLICATE KEY UPDATE
        post_code = VALUES(post_code),
        comm_id = VALUES(comm_id),
        comm_name = VALUES(comm_name),
        total_members = VALUES(total_members),
        no_of_rais = VALUES(no_of_rais),
        no_of_trees = VALUES(no_of_trees),
        forecast_yield = VALUES(forecast_yield),
        created_at = VALUES(created_at),
        updated_at = VALUES(updated_at),
        community_province_code = VALUES(community_province_code),
        community_district_code = VALUES(community_district_code),
        community_subdistrict_code = VALUES(community_subdistrict_code),
        fetch_at = NOW()
    `;

    const dataWithTimestamp = communityData.map((row) => [...row, new Date()]);
    const [result] = await connection.query(sql, [dataWithTimestamp]);

    const [afterResult] = await connection.query(
      "SELECT COUNT(*) as count FROM communities"
    );
    const countAfter = afterResult[0].count;

    console.timeEnd("Bulk database operation");

    const actualInserted = countAfter - countBefore;
    const actualUpdated = communities.length - actualInserted;

    console.log(
      `📊 Bulk operation: ${actualInserted} inserted, ${actualUpdated} updated`
    );
    console.log(
      `📊 Database: ${countBefore} → ${countAfter} (+${actualInserted})`
    );

    return {
      inserted: actualInserted,
      updated: actualUpdated,
      errors: 0,
      affectedRows: result.affectedRows,
      totalProcessed: communities.length,
    };
  } catch (error) {
    console.error("❌ Bulk community insert/update error:", error);

    return {
      inserted: 0,
      updated: 0,
      errors: communities.length,
      affectedRows: 0,
      totalProcessed: communities.length,
      error: error.message,
    };
  }
};

/**
 * Get the current count of communities in the database
 */
export const getCommunitiesCount = async () => {
  try {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM communities");
    return result[0].total;
  } catch (error) {
    console.error("❌ Error getting communities count:", error);
    return 0;
  }
};

/**
 * Reset the communities table
 */
export const resetCommunitiesTable = async () => {
  const connection = connectionDB.promise();

  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    await connection.query("TRUNCATE TABLE communities");
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    return { success: true, message: "Communities table reset successfully" };
  } catch (error) {
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    console.error("❌ Error resetting communities table:", error);
    throw error;
  }
};
