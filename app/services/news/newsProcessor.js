// ===================== Imports =====================
// Import API client for fetching news data
import { getNews } from "../api/news.js";
// Import DB helper for upserting news records
import { bulkInsertOrUpdateNews } from "../db/newsDb.js";
// Import DB connection for direct queries
import { connectionDB } from "../../config/db/db.conf.js";
// Import config constants and operation enums
import { NEWS_CONFIG } from "../../utils/constants.js";
// Import logger for structured process logging
import NewsLogger from "./newsLogger.js";

// ===================== Processor =====================
// NewsProcessor handles fetching, deduplication, and DB upserts for news.
export default class NewsProcessor {
  /**
   * 1. Get DB count before processing
   * 2. Fetch all news data from API (paginated)
   * 3. Deduplicate records
   * 4. Log summary
   * 5. Bulk upsert to DB
   * 6. Get DB count after processing
   * 7. Return result object
   */
  static async fetchAndProcessData() {
    // 1. Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // 2. Fetch all news data from API (paginated)
    const allNews = await this._fetchAllPages();

    // 3. Deduplicate records
    const uniqueNews = this._getUniqueNews(allNews);

    // 4. Log summary
    NewsLogger.logApiSummary(allNews.length, uniqueNews.length);

    // 5. Bulk upsert to DB
    const bulkResult = await bulkInsertOrUpdateNews(uniqueNews);

    // 6. Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // 7. Return result object
    return {
      inserted: bulkResult.inserted || 0,
      updated: bulkResult.updated || 0,
      errors: bulkResult.errors || 0,
      totalProcessed: uniqueNews.length,
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      growth: dbCountAfter - dbCountBefore,
      totalFromAPI: allNews.length,
      uniqueFromAPI: uniqueNews.length,
    };
  }

  /**
   * Fetches all pages of news from the API (paginated).
   */
  static async _fetchAllPages() {
    let page = 1;
    let allNews = [];
    let hasMore = true;
    while (hasMore) {
      const requestBody = {
        fromDate: NEWS_CONFIG.FROM_DATE,
        toDate: NEWS_CONFIG.TO_DATE,
        provinceName: "",
        pageIndex: page,
        pageSize: NEWS_CONFIG.DEFAULT_PAGE_SIZE,
      };
      const news = await getNews(requestBody);
      const newsCurPage = news.data || [];
      allNews = allNews.concat(newsCurPage);
      NewsLogger.logPageInfo(page, newsCurPage);
      hasMore = newsCurPage.length === NEWS_CONFIG.DEFAULT_PAGE_SIZE;
      page++;
    }
    return allNews;
  }

  /**
   * Deduplicates news by recId.
   */
  static _getUniqueNews(allNews) {
    const uniqueMap = new Map();
    for (const news of allNews) {
      if (news.recId && !uniqueMap.has(news.recId)) {
        uniqueMap.set(news.recId, news);
      }
    }
    return Array.from(uniqueMap.values());
  }

  /**
   * Gets the current count of news records in the DB.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM news");
    return result[0].total;
  }
}
