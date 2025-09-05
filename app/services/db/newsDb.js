// ===================== Imports =====================
// Import DB connection for executing SQL queries
import { connectionDB } from "../../config/db/db.conf.js";
import { OPERATIONS } from "../../utils/constants.js";

// ===================== Reference Lookup =====================
/**
 * Ensures a reference code exists in the table, inserts if not found.
 * @param {string} table - Reference table name.
 * @param {string} nameColumn - Column for the name.
 * @param {string} codeColumn - Column for the code.
 * @param {string} name - Name to look up or insert.
 * @param {string} generatedCodePrefix - Prefix for generated codes. (kept for compatibility)
 * @returns {Promise<string|null>} - The code.
 */
async function ensureRefCode(
  table,
  nameColumn,
  codeColumn,
  name,
  generatedCodePrefix // unused in this version (numeric MAX-based)
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
    }

    // Generate next numeric code (no prefix, uses MAX)
    const [maxResult] = await connectionDB
      .promise()
      .query(
        `SELECT MAX(CAST(${codeColumn} AS UNSIGNED)) AS maxId FROM ${table}`
      );

    const newCode =
      maxResult.length > 0 && maxResult[0].maxId !== null
        ? String(Number(maxResult[0].maxId) + 1)
        : "1";

    await connectionDB
      .promise()
      .query(
        `INSERT INTO ${table} (${codeColumn}, ${nameColumn}) VALUES (?, ?)`,
        [newCode, name]
      );

    console.log(`🆕 Created new ${table}: ${newCode} = "${name}"`);
    return newCode;
  } catch (err) {
    console.error(`${table} lookup error:`, err.message);
    return null;
  }
}

// ===================== Insert/Update =====================
/**
 * Inserts or updates a news record in the database.
 * Maps province and news group to codes, checks for existence, and upserts accordingly.
 * @param {object} news - News data object.
 * @returns {Promise<object>} - Operation result.
 */
export async function insertOrUpdateNews(news) {
  try {
    // Convert province and news group to codes
    const provinceCode = await ensureRefCode(
      "ref_provinces",
      "province_name_th",
      "province_code",
      news.province,
      "GPROV"
    );

    const newsGroupCode = await ensureRefCode(
      "ref_news_groups",
      "news_group_name",
      "news_group_id",
      news.newsGroup,
      "NG"
    );

    // === Prepare values ===
    const values = {
      rec_id: news.recId,
      news_province_code: provinceCode,
      news_id: news.newsId,
      announce_date: news.announceDate || null,
      news_group_id: newsGroupCode,
      news_topic: news.newsTopic || null,
      news_detail: news.newsDetail || null,
      no_of_like: news.noOfLike || null,
      no_of_comments: news.noOfComments || null,
      created_at: news.createdTime || null,
      updated_at: news.updatedTime || null,
      fetch_at: new Date(),
      company_id: news.companyId || null,
    };

    // Check if news already exists
    const [existing] = await connectionDB
      .promise()
      .query(`SELECT id FROM news WHERE rec_id = ? LIMIT 1`, [values.rec_id]);

    if (existing.length > 0) {
      // UPDATE existing news
      await connectionDB
        .promise()
        .query(
          `UPDATE news SET 
             news_province_code = ?, 
             news_id = ?, 
             announce_date = ?, 
             news_group_id = ?, 
             news_topic = ?, 
             news_detail = ?, 
             no_of_like = ?, 
             no_of_comments = ?, 
             updated_at = ?, 
             fetch_at = ?,
             company_id = ?
           WHERE rec_id = ?`,
          [
            values.news_province_code,
            values.news_id,
            values.announce_date,
            values.news_group_id,
            values.news_topic,
            values.news_detail,
            values.no_of_like,
            values.no_of_comments,
            values.updated_at,
            values.fetch_at,
            values.company_id,
            values.rec_id,
          ]
        );

      return { operation: OPERATIONS.UPDATE, recId: values.rec_id };
    }

    // INSERT new news
    await connectionDB
      .promise()
      .query(
        `INSERT INTO news 
           (rec_id, news_province_code, news_id, announce_date, 
            news_group_id, news_topic, news_detail, no_of_like, 
            no_of_comments, created_at, updated_at, fetch_at, company_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          values.rec_id,
          values.news_province_code,
          values.news_id,
          values.announce_date,
          values.news_group_id,
          values.news_topic,
          values.news_detail,
          values.no_of_like,
          values.no_of_comments,
          values.created_at,
          values.updated_at,
          values.fetch_at,
          values.company_id,
        ]
      );

    return { operation: OPERATIONS.INSERT, recId: values.rec_id };
  } catch (err) {
    console.error("News insert/update error:", err);
    return {
      operation: OPERATIONS.ERROR,
      recId: news.recId,
      error: err.message,
    };
  }
}
