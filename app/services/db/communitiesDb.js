// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";

/**
 * Get Bangkok timezone timestamp as MySQL-compatible string
 */
const getBangkokTime = () => {
  return new Date()
    .toLocaleString("sv-SE", {
      timeZone: "Asia/Bangkok",
    })
    .replace(" ", "T");
};

/**
 * Bulk ensure reference codes for a list of names
 */
const bulkEnsureRefCodes = async (
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
export async function bulkProcessReferenceCodes(communities) {
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
}

/**
 * Bulk insert or update communities using INSERT ... ON DUPLICATE KEY UPDATE
 * @param {Array} communities - Array of community objects
 * @returns {Promise<object>} - Bulk operation result
 */
export async function bulkInsertOrUpdateCommunities(communities) {
  const bangkokTime = getBangkokTime();

  const processedCommunities = communities.map((community) => [
    community.recId,
    community.province,
    community.amphur,
    community.tambon,
    community.postCode,
    community.commId,
    community.commName ?? null,
    community.totalMembers ?? null,
    community.noOfRais ?? null,
    community.noOfTrees ?? null,
    community.forecastYield ?? null,
    community.createdTime ?? null,
    community.updatedTime ?? null,
    bangkokTime,
  ]);

  const query = `
    INSERT INTO communities (
      rec_id, province, district, subdistrict, post_code, comm_id, comm_name,
      total_members, no_of_rais, no_of_trees, forecast_yield,
      created_at, updated_at, fetch_at
    ) VALUES ?
    ON DUPLICATE KEY UPDATE
      province = VALUES(province),
      district = VALUES(district),
      subdistrict = VALUES(subdistrict),
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

  const [result] = await connectionDB
    .promise()
    .query(query, [processedCommunities]);

  return {
    inserted: result.affectedRows,
    updated: 0,
    errors: 0,
    totalAfter: processedCommunities.length,
  };
}
