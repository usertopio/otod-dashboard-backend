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
 * Bulk process reference codes for all news at once
 */
async function bulkProcessReferenceCodes(newsRecords) {
  // Get unique values - check what properties are actually available
  const provinces = [
    ...new Set(newsRecords.map((n) => n.province).filter(Boolean)),
  ];
  const newsGroups = [
    ...new Set(newsRecords.map((n) => n.newsGroup).filter(Boolean)),
  ];

  // Bulk lookup/create all reference codes
  const [provinceCodes, newsGroupCodes] = await Promise.all([
    bulkEnsureRefCodes(
      "ref_provinces",
      "province_name_th",
      "province_code",
      provinces,
      "GPROV"
    ),
    bulkEnsureRefCodes(
      "ref_news_groups",
      "news_group_name",
      "news_group_id",
      newsGroups,
      "NG"
    ),
  ]);

  return { provinceCodes, newsGroupCodes };
}

/**
 * Bulk insert or update news using INSERT ... ON DUPLICATE KEY UPDATE
 * @param {Array} newsRecords - Array of news objects
 * @returns {Promise<object>} - Bulk operation result
 */
export async function bulkInsertOrUpdateNews(newsRecords) {
  if (!newsRecords || newsRecords.length === 0) {
    return { inserted: 0, updated: 0, errors: 0 };
  }

  try {
    console.time("⏱️ Reference codes processing");

    // BULK process all reference codes at once
    const { provinceCodes, newsGroupCodes } = await bulkProcessReferenceCodes(
      newsRecords
    );

    console.timeEnd("⏱️ Reference codes processing");
    console.time("⏱️ Data preparation");

    // Get current count before operation
    const [countBefore] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM news");
    const beforeCount = countBefore[0].count;

    // ✅ FIXED: Prepare news data matching actual schema
    const newsData = newsRecords.map((news) => [
      news.recId, // rec_id
      provinceCodes.get(news.province) || null, // news_province_code
      news.newsId, // news_id
      news.announceDate || null, // announce_date
      newsGroupCodes.get(news.newsGroup) || null, // news_group_id
      news.newsTopic || news.newsTitle || null, // news_topic
      news.newsDetail || news.newsContent || null, // news_detail
      news.noOfLike || 0, // no_of_like
      news.noOfComments || 0, // no_of_comments
      news.createdTime || news.createdAt, // created_at
      news.updatedTime || news.updatedAt, // updated_at
      news.companyId, // company_id
      new Date(), // fetch_at
    ]);

    console.timeEnd("⏱️ Data preparation");
    console.time("⏱️ Bulk database operation");

    // ✅ FIXED: SQL query matching actual table schema
    const insertQuery = `
      INSERT INTO news (
        rec_id, news_province_code, news_id, announce_date, news_group_id,
        news_topic, news_detail, no_of_like, no_of_comments,
        created_at, updated_at, company_id, fetch_at
      ) VALUES ? 
      ON DUPLICATE KEY UPDATE
        news_province_code = VALUES(news_province_code),
        news_id = VALUES(news_id),
        announce_date = VALUES(announce_date),
        news_group_id = VALUES(news_group_id),
        news_topic = VALUES(news_topic),
        news_detail = VALUES(news_detail),
        no_of_like = VALUES(no_of_like),
        no_of_comments = VALUES(no_of_comments),
        updated_at = VALUES(updated_at),
        company_id = VALUES(company_id),
        fetch_at = VALUES(fetch_at)
    `;

    // Execute bulk operation
    const [result] = await connectionDB
      .promise()
      .query(insertQuery, [newsData]);

    console.timeEnd("⏱️ Bulk database operation");

    // Get count after operation
    const [countAfter] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as count FROM news");
    const afterCount = countAfter[0].count;

    // Calculate actual inserts and updates
    const actualInserts = afterCount - beforeCount;
    const actualUpdates = newsRecords.length - actualInserts;

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
      totalProcessed: newsRecords.length,
    };
  } catch (err) {
    console.error("Bulk news insert/update error:", err);
    return {
      operation: "BULK_ERROR",
      inserted: 0,
      updated: 0,
      errors: newsRecords.length,
      totalProcessed: newsRecords.length,
    };
  }
}

// Keep existing individual function for compatibility
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
    await connectionDB.promise().query(
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
