const { getNews } = require("../api/news");
const { insertOrUpdateNews } = require("../db/newsDb");
const NewsLogger = require("./newsLogger");
const { NEWS_CONFIG, OPERATIONS } = require("../../utils/constants");

class NewsProcessor {
  static async fetchAndProcessData() {
    // Calculate pages using constants
    const totalRecords = NEWS_CONFIG?.TOTAL_RECORDS || 5;
    const pageSize = NEWS_CONFIG?.PAGE_SIZE || 500;
    const pages = Math.ceil(totalRecords / pageSize);

    // Initialize metrics
    const metrics = {
      insertCount: 0,
      updateCount: 0,
      errorCount: 0,
      newRecIds: [],
      updatedRecIds: [],
      errorRecIds: [],
      processedRecIds: new Set(),
      allNewsAllPages: [],
    };

    // Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // Fetch all pages
    await this._fetchAllPages(pages, metrics);

    // Get unique news (filter duplicates by recId)
    const uniqueNews = this._getUniqueNews(metrics.allNewsAllPages);

    // Process unique news
    await this._processUniqueNews(uniqueNews, metrics);

    // Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    return this._buildResult(metrics, dbCountBefore, dbCountAfter);
  }

  static async _fetchAllPages(pages, metrics) {
    for (let page = 1; page <= pages; page++) {
      const requestBody = {
        provinceName: "",
        fromDate: "2024-10-01",
        toDate: "2024-12-31",
        pageIndex: page,
        pageSize: 500,
      };

      const customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      // Fetch news data from API
      const newsResponse = await getNews(requestBody, customHeaders);
      const newsData = newsResponse.data || [];

      // Log page info
      NewsLogger.logPageInfo(page, newsData);

      // Add to all news
      metrics.allNewsAllPages = metrics.allNewsAllPages.concat(newsData);
    }

    // Log API summary
    const uniqueCount = this._getUniqueNews(metrics.allNewsAllPages).length;
    NewsLogger.logApiSummary(metrics.allNewsAllPages.length, uniqueCount);
  }

  static _getUniqueNews(allNews) {
    return allNews.filter(
      (news, index, self) =>
        index === self.findIndex((n) => n.recId === news.recId)
    );
  }

  static async _processUniqueNews(uniqueNews, metrics) {
    for (const news of uniqueNews) {
      const result = await insertOrUpdateNews(news);

      switch (result.operation) {
        case OPERATIONS.INSERT:
          metrics.insertCount++;
          metrics.newRecIds.push(news.recId);
          break;
        case OPERATIONS.UPDATE:
          metrics.updateCount++;
          metrics.updatedRecIds.push(news.recId);
          break;
        case OPERATIONS.ERROR:
          metrics.errorCount++;
          metrics.errorRecIds.push(news.recId);
          break;
      }

      metrics.processedRecIds.add(news.recId);
    }
  }

  static async _getDatabaseCount() {
    const { connectionDB } = require("../../config/db/news.conf.js");
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM news");
    return result[0].total;
  }

  static _buildResult(metrics, dbCountBefore, dbCountAfter) {
    const uniqueNews = this._getUniqueNews(metrics.allNewsAllPages);

    const result = {
      // Database metrics
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      inserted: metrics.insertCount,
      updated: metrics.updateCount,
      errors: metrics.errorCount,
      growth: dbCountAfter - dbCountBefore,

      // API metrics
      totalFromAPI: metrics.allNewsAllPages.length,
      uniqueFromAPI: uniqueNews.length,
      duplicatedDataAmount: metrics.allNewsAllPages.length - uniqueNews.length,

      // Record tracking
      newRecIds: metrics.newRecIds,
      updatedRecIds: metrics.updatedRecIds,
      errorRecIds: metrics.errorRecIds,
      processedRecIds: Array.from(metrics.processedRecIds),

      // Additional insights
      totalProcessingOperations:
        metrics.insertCount + metrics.updateCount + metrics.errorCount,
      recordsInDbNotInAPI: Math.max(
        0,
        dbCountBefore - metrics.processedRecIds.size
      ),
    };

    return result;
  }
}

module.exports = NewsProcessor;
