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

// ===================== DB Utilities =====================

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
