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
class NewsProcessor {
  /**
   * Fetches all news data from the API, deduplicates, and upserts into DB.
   * Returns a result object with metrics and tracking info.
   */
  static async fetchAndProcessData() {
    // Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // Initialize metrics
    const metrics = {
      allNewsAllPages: [],
    };

    // Fetch data from all pages
    await this._fetchNewsPages(metrics);

    // Process unique news
    const uniqueNews = this._getUniqueNews(metrics.allNewsAllPages);

    NewsLogger.logApiSummary(metrics.allNewsAllPages.length, uniqueNews.length);

    // Process all news at once
    console.log(
      `🚀 Processing ${uniqueNews.length} unique news records using BULK operations...`
    );

    const bulkResult = await bulkInsertOrUpdateNews(uniqueNews);

    // Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    // Return simplified result compatible with service
    return {
      inserted: bulkResult.inserted || 0,
      updated: bulkResult.updated || 0,
      errors: bulkResult.errors || 0,
      totalProcessed: uniqueNews.length,
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      growth: dbCountAfter - dbCountBefore,

      // Keep existing properties for compatibility
      allNewsAllPages: metrics.allNewsAllPages,
      uniqueFromAPI: uniqueNews.length,
      totalFromAPI: metrics.allNewsAllPages.length,
    };
  }

  /**
   * Fetches all pages of news from the API and logs each page.
   * @param {object} metrics - Metrics object to accumulate results.
   */
  static async _fetchNewsPages(metrics) {
    let page = 1;
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
      const allNewsCurPage = news.data || [];
      metrics.allNewsAllPages = metrics.allNewsAllPages.concat(allNewsCurPage);

      NewsLogger.logPageInfo(page, allNewsCurPage);

      // Stop if no more data
      if (allNewsCurPage.length < NEWS_CONFIG.DEFAULT_PAGE_SIZE) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  /**
   * Deduplicates news by recId.
   * @param {Array} allNews - Array of all news from API.
   * @returns {Array} - Array of unique news.
   */
  static _getUniqueNews(allNews) {
    return allNews.filter(
      (news, index, self) =>
        index === self.findIndex((n) => n.recId === news.recId)
    );
  }

  /**
   * Gets the current count of news in the DB.
   * @returns {Promise<number>} - Total number of news.
   */
  static async _getDatabaseCount() {
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM news");
    return result[0].total;
  }
}

// ===================== Exports =====================
export default NewsProcessor;
