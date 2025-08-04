const { getNews, getNewsSummaryByMonth } = require("../services/api/news.js");
const {
  insertANew,
  insertNewsSummaryByMonth,
} = require("../services/db/newsDb.js");
const NewsService = require("../services/news/newsService");
const { NEWS_CONFIG } = require("../utils/constants");

class NewsController {
  static async fetchNewsUntilTarget(req, res) {
    try {
      const targetCount =
        (req.body && req.body.targetCount) ||
        NEWS_CONFIG.DEFAULT_TARGET_COUNT ||
        5;
      const maxAttempts =
        (req.body && req.body.maxAttempts) ||
        NEWS_CONFIG.DEFAULT_MAX_ATTEMPTS ||
        5;

      const result = await NewsService.fetchNewsUntilTarget(
        targetCount,
        maxAttempts
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error in fetchNewsUntilTarget:", error);
      return res.status(500).json({
        message: "Failed to fetch news until target",
        error: error.message,
      });
    }
  }
}

module.exports = {
  fetchNewsUntilTarget: NewsController.fetchNewsUntilTarget,
};
