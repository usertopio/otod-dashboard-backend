const NewsService = require("../services/news/newsService");
const { NEWS_CONFIG } = require("../utils/constants");

const fetchNews = async (req, res) => {
  try {
    const targetCount =
      req.body.targetCount || NEWS_CONFIG.DEFAULT_TARGET_COUNT;
    const maxAttempts =
      req.body.maxAttempts || NEWS_CONFIG.DEFAULT_MAX_ATTEMPTS;

    console.log(
      `Starting fetchNews with target: ${targetCount}, max attempts: ${maxAttempts}`
    );

    const result = await NewsService.fetchNews(targetCount, maxAttempts);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in fetchNews:", error);
    res.status(500).json({
      error: "Failed to fetch news data",
      details: error.message,
    });
  }
};

module.exports = {
  fetchNews,
};
