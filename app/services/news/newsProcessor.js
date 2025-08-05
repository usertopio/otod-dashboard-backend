const { getNews } = require("../api/news");
const { insertOrUpdateNews } = require("../db/newsDb");
const { connectionDB } = require("../../config/db/db.conf.js");
const { NEWS_CONFIG, OPERATIONS } = require("../../utils/constants");
const NewsLogger = require("./newsLogger");

class NewsProcessor {
  static async fetchAndProcessData() {
    const pages = Math.ceil(
      NEWS_CONFIG.DEFAULT_TOTAL_RECORDS / NEWS_CONFIG.DEFAULT_PAGE_SIZE
    );

    // Initialize counters
    const metrics = {
      allNewsAllPages: [],
      insertCount: 0,
      updateCount: 0,
      errorCount: 0,
      processedRecIds: new Set(),
      newRecIds: [],
      updatedRecIds: [],
      errorRecIds: [],
    };

    // Get database count before processing
    const dbCountBefore = await this._getDatabaseCount();

    // Fetch data from all pages
    await this._fetchAllPages(pages, metrics);

    // Process unique news
    const uniqueNews = this._getUniqueNews(metrics.allNewsAllPages);
    NewsLogger.logApiSummary(metrics.allNewsAllPages.length, uniqueNews.length);

    // Process each unique news
    await this._processUniqueNews(uniqueNews, metrics);

    // Get database count after processing
    const dbCountAfter = await this._getDatabaseCount();

    return this._buildResult(metrics, dbCountBefore, dbCountAfter);
  }

  static async _fetchAllPages(pages, metrics) {
    for (let page = 1; page <= pages; page++) {
      const requestBody = {
        provinceName: "",
        pageIndex: page,
        pageSize: NEWS_CONFIG.DEFAULT_PAGE_SIZE,
      };

      const customHeaders = {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      };

      const news = await getNews(requestBody, customHeaders);
      const allNewsCurPage = news.data;
      metrics.allNewsAllPages = metrics.allNewsAllPages.concat(allNewsCurPage);

      NewsLogger.logPageInfo(page, allNewsCurPage);
    }
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
    const [result] = await connectionDB
      .promise()
      .query("SELECT COUNT(*) as total FROM news");
    return result[0].total;
  }

  static _buildResult(metrics, dbCountBefore, dbCountAfter) {
    return {
      // Database metrics
      totalBefore: dbCountBefore,
      totalAfter: dbCountAfter,
      inserted: metrics.insertCount,
      updated: metrics.updateCount,
      errors: metrics.errorCount,
      growth: dbCountAfter - dbCountBefore,

      // API metrics
      totalFromAPI: metrics.allNewsAllPages.length,
      uniqueFromAPI: metrics.allNewsAllPages.filter(
        (news, index, self) =>
          index === self.findIndex((n) => n.recId === news.recId)
      ).length,
      duplicatedDataAmount:
        metrics.allNewsAllPages.length -
        metrics.insertCount -
        metrics.updateCount,

      // Record tracking
      newRecIds: metrics.newRecIds,
      updatedRecIds: metrics.updatedRecIds,
      errorRecIds: metrics.errorRecIds,
      processedRecIds: Array.from(metrics.processedRecIds),

      // Additional insights
      recordsInDbNotInAPI: dbCountBefore - metrics.updateCount,
      totalProcessingOperations:
        metrics.insertCount + metrics.updateCount + metrics.errorCount,

      // For compatibility
      allNewsAllPages: metrics.allNewsAllPages,
    };
  }
}

module.exports = NewsProcessor;
