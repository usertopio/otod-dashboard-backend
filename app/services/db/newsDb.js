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
async function bulkEnsureRefCodes(
  table,
  nameColumn,
  codeColumn,
  names,
  prefix
) {
  if (!names || names.length === 0) return new Map();

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
}

/**
 * Bulk process reference codes for all news at once
 */
export async function bulkProcessReferenceCodes(newsRecords) {
  console.time("Reference codes processing");

  try {
    // Get unique values
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

    console.timeEnd("Reference codes processing");
    return { provinceCodes, newsGroupCodes };
  } catch (error) {
    console.error("❌ Error in bulkProcessReferenceCodes:", error);
    console.timeEnd("Reference codes processing");
    return { provinceCodes: new Map(), newsGroupCodes: new Map() };
  }
}

/**
 * Bulk insert or update news using INSERT ... ON DUPLICATE KEY UPDATE
 * @param {Array} newsRecords - Array of news objects
 * @returns {Promise<object>} - Bulk operation result
 */
export async function bulkInsertOrUpdateNews(newsRecords) {
  if (!newsRecords || newsRecords.length === 0) {
    return { inserted: 0, updated: 0, errors: 0, skipped: 0 };
  }

  const connection = connectionDB.promise();

  try {
    console.time("Reference codes processing");

    // BULK process all reference codes at once
    const { provinceCodes, newsGroupCodes } = await bulkProcessReferenceCodes(
      newsRecords
    );

    console.timeEnd("Reference codes processing");
    console.time("Data preparation");

    // Get current count before operation
    const [countBefore] = await connection.query(
      "SELECT COUNT(*) as count FROM news"
    );
    const beforeCount = countBefore[0].count;

    // Get Bangkok time
    const bangkokTime = getBangkokTime();

    // Validate and prepare news data
    const validNews = newsRecords.map((news) => [
      news.recId,
      provinceCodes.get(news.province) || null,
      news.newsId,
      news.announceDate || null,
      newsGroupCodes.get(news.newsGroup) || null,
      news.newsTopic || news.newsTitle || null,
      news.newsDetail || news.newsContent || null,
      news.noOfLike || 0,
      news.noOfComments || 0,
      news.createdTime || news.createdAt,
      news.updatedTime || news.updatedAt,
      news.companyId,
      bangkokTime,
    ]);

    console.log(
      `📊 Validation: ${validNews.length} valid, 0 skipped news records`
    );

    let actualInserts = 0;
    let actualUpdates = 0;
    let result = null;

    if (validNews.length > 0) {
      console.timeEnd("Data preparation");
      console.time("Bulk database operation");

      const sql = `
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

      // Use validNews directly
      [result] = await connection.query(sql, [validNews]);

      console.timeEnd("Bulk database operation");

      // Get count after operation
      const [countAfter] = await connection.query(
        "SELECT COUNT(*) as count FROM news"
      );
      const afterCount = countAfter[0].count;

      actualInserts = afterCount - beforeCount;
      actualUpdates = validNews.length - actualInserts;
    } else {
      console.timeEnd("Data preparation");
      console.log("⚠️  No valid news records to process");
    }

    console.log(
      `📊 Bulk operation: ${actualInserts} inserted, ${actualUpdates} updated, 0 skipped`
    );
    console.log(
      `📊 Database: ${beforeCount} → ${beforeCount + actualInserts} (${
        actualInserts > 0 ? "+" + actualInserts : "no change"
      })`
    );

    return {
      inserted: actualInserts,
      updated: Math.max(0, actualUpdates),
      errors: 0,
      skipped: 0,
      totalProcessed: newsRecords.length,
      affectedRows: result?.affectedRows || 0,
    };
  } catch (error) {
    console.error("❌ Bulk news insert/update error:", error);
    return {
      inserted: 0,
      updated: 0,
      errors: newsRecords.length,
      skipped: 0,
      totalProcessed: newsRecords.length,
      error: error.message,
    };
  }
}
