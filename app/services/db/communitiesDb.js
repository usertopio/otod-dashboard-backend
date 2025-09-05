// db/communitiesDb.js (ESM)

// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";
import { OPERATIONS } from "../../utils/constants.js";

// ===================== DB Utilities =====================
// Provides helper functions for reference code lookup and upserting communities

/**
 * Ensures a reference code exists in the table, inserts if not found.
 * @param {string} table - Reference table name.
 * @param {string} nameColumn - Column for the name.
 * @param {string} codeColumn - Column for the code.
 * @param {string} name - Name to look up or insert.
 * @param {string} generatedCodePrefix - Prefix for generated codes.
 * @returns {Promise<string|null>} - The code or null on error/empty name.
 */
export async function ensureRefCode(
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
    }

    // Generate new code if not found
    const [maxResult] = await connectionDB
      .promise()
      .query(
        `SELECT ${codeColumn} FROM ${table} ORDER BY ${codeColumn} DESC LIMIT 1`
      );

    let newCode;
    if (maxResult.length > 0) {
      const lastCode = maxResult[0][codeColumn];
      const lastNumber = parseInt(
        String(lastCode).replace(generatedCodePrefix, ""),
        10
      );
      newCode = `${generatedCodePrefix}${String(lastNumber + 1).padStart(
        3,
        "0"
      )}`;
    } else {
      newCode = `${generatedCodePrefix}001`;
    }

    await connectionDB
      .promise()
      .query(
        `INSERT INTO ${table} (${codeColumn}, ${nameColumn}, source) VALUES (?, ?, 'generated')`,
        [newCode, name]
      );

    console.log(`🆕 Created new ${table}: ${newCode} = "${name}"`);
    return newCode;
  } catch (err) {
    console.error(`${table} lookup error:`, err.message);
    return null;
  }
}

/**
 * Inserts or updates a community record in the database.
 * Maps reference codes, checks for existence, and upserts accordingly.
 * @param {object} community - Community data object.
 * @returns {Promise<object>} - Operation result.
 */
export async function insertOrUpdateCommunity(community) {
  try {
    // Map province, district, subdistrict to codes
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

    // === Prepare values ===
    const values = {
      rec_id: community.recId,
      community_province_code: provinceCode,
      community_district_code: districtCode,
      community_subdistrict_code: subdistrictCode,
      post_code: community.postCode || null,
      comm_id: community.commId,
      comm_name: community.commName || null,
      total_members: community.totalMembers || null,
      no_of_rais: community.noOfRais || null,
      no_of_trees: community.noOfTrees || null,
      forecast_yield: community.forecastYield || null,
      created_at: community.createdTime || null,
      updated_at: community.updatedTime || null,
      fetch_at: new Date(),
    };

    // Check if community already exists
    const [existing] = await connectionDB
      .promise()
      .query(`SELECT id FROM communities WHERE rec_id = ? LIMIT 1`, [
        values.rec_id,
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
           updated_at = ?, 
           fetch_at = ?
           WHERE rec_id = ?`,
        [
          values.community_province_code,
          values.community_district_code,
          values.community_subdistrict_code,
          values.post_code,
          values.comm_id,
          values.comm_name,
          values.total_members,
          values.no_of_rais,
          values.no_of_trees,
          values.forecast_yield,
          values.updated_at,
          values.fetch_at,
          values.rec_id,
        ]
      );

      return { operation: OPERATIONS.UPDATE, recId: values.rec_id };
    }

    // INSERT new community
    await connectionDB.promise().query(
      `INSERT INTO communities 
         (rec_id, community_province_code, community_district_code, 
          community_subdistrict_code, post_code, comm_id, comm_name, 
          total_members, no_of_rais, no_of_trees, forecast_yield, 
          created_at, updated_at, fetch_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        values.rec_id,
        values.community_province_code,
        values.community_district_code,
        values.community_subdistrict_code,
        values.post_code,
        values.comm_id,
        values.comm_name,
        values.total_members,
        values.no_of_rais,
        values.no_of_trees,
        values.forecast_yield,
        values.created_at,
        values.updated_at,
        values.fetch_at,
      ]
    );

    return { operation: OPERATIONS.INSERT, recId: values.rec_id };
  } catch (err) {
    console.error("Community insert/update error:", err);
    return {
      operation: OPERATIONS.ERROR,
      recId: community.recId,
      error: err.message,
    };
  }
}
