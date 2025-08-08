// ===================== Imports =====================
const { connectionDB } = require("../../config/db/db.conf.js");
const { OPERATIONS } = require("../../utils/constants");

// ===================== Reference Lookup =====================
/**
 * Ensures a reference code exists in the table, inserts if not found.
 * @param {string} table - Reference table name.
 * @param {string} nameColumn - Column for the name.
 * @param {string} codeColumn - Column for the code.
 * @param {string} name - Name to look up or insert.
 * @param {string} generatedCodePrefix - Prefix for generated codes.
 * @returns {Promise<string>} - The code.
 */
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

// ===================== Insert/Update =====================
/**
 * Inserts or updates a news record in the database.
 * Maps province and news group to codes, checks for existence, and upserts accordingly.
 * @param {object} news - News data object.
 * @returns {Promise<object>} - Operation result.
 */
const insertOrUpdateNews = async (news) => {
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

    // Check if news already exists
    const [existing] = await connectionDB
      .promise()
      .query(`SELECT id FROM news WHERE rec_id = ? LIMIT 1`, [news.recId]);

    if (existing.length > 0) {
      // UPDATE existing news
      await connectionDB.promise().query(
        `UPDATE news SET 
         news_province_code = ?, 
         news_id = ?, 
         announce_date = ?, 
         news_group_id = ?, 
         news_topic = ?, 
         news_detail = ?, 
         no_of_like = ?, 
         no_of_comments = ?, 
         updated_at = NOW(),
         fetch_at = NOW()
         WHERE rec_id = ?`,
        [
          provinceCode,
          news.newsId,
          news.announceDate || null,
          newsGroupCode,
          news.newsTopic || null,
          news.newsDetail || null,
          news.noOfLike || null,
          news.noOfComments || null,
          news.recId,
        ]
      );

      return { operation: OPERATIONS.UPDATE, recId: news.recId };
    } else {
      // INSERT new news
      await connectionDB.promise().query(
        `INSERT INTO news 
         (rec_id, news_province_code, news_id, announce_date, 
          news_group_id, news_topic, news_detail, no_of_like, 
          no_of_comments, created_at, updated_at, fetch_at, company_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW(), ?)`,
        [
          news.recId,
          provinceCode,
          news.newsId,
          news.announceDate || null,
          newsGroupCode,
          news.newsTopic || null,
          news.newsDetail || null,
          news.noOfLike || null,
          news.noOfComments || null,
          news.companyId || null,
        ]
      );

      return { operation: OPERATIONS.INSERT, recId: news.recId };
    }
  } catch (err) {
    console.error("News insert/update error:", err);
    return {
      operation: OPERATIONS.ERROR,
      recId: news.recId,
      error: err.message,
    };
  }
};

// ===================== Exports =====================
module.exports = {
  insertOrUpdateNews,
};
