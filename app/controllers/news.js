const { getNews, getNewsSummaryByMonth } = require("../services/api/news.js");
const {
  insertANew,
  insertNewsSummaryByMonth,
} = require("../services/db/newsDb.js");
const NewsService = require("../services/news/newsService");

// 🎯 ONLY: fetchNewsUntilTarget endpoint
exports.fetchNewsUntilTarget = async (req, res) => {
  try {
    const targetCount = req.body.targetCount || 5; // Default: 5 news
    const maxAttempts = req.body.maxAttempts || 5; // Default: 5 attempts

    const result = await NewsService.fetchNewsUntilTarget(
      targetCount,
      maxAttempts
    );

    res.json(result);
  } catch (error) {
    console.error("Error in fetchNewsUntilTarget:", error);
    res.status(500).json({
      error: "Failed to fetch news until target",
      details: error.message,
    });
  }
};
