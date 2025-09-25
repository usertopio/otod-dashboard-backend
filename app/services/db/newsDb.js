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
      news.province,
      news.newsId,
      news.announceDate || null,
      news.newsGroup ?? null,
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
          rec_id, province, news_id, announce_date, news_group,
          news_topic, news_detail, no_of_like, no_of_comments,
          created_at, updated_at, company_id, fetch_at
        ) VALUES ? 
        ON DUPLICATE KEY UPDATE
          province = VALUES(province),
          news_id = VALUES(news_id),
          announce_date = VALUES(announce_date),
          news_group = VALUES(news_group),
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
