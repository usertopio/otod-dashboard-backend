// ===================== Imports =====================
// Import the NewsService for business logic
const NewsService = require("../services/news/newsService");
const { NEWS_CONFIG } = require("../utils/constants");

// ===================== Controller =====================
// Handles HTTP requests for news-related operations
const fetchNews = async (req, res) => {
  try {
    // Get maxAttempts from request body or use default
    const maxAttempts =
      (req.body && req.body.maxAttempts) || NEWS_CONFIG.DEFAULT_MAX_ATTEMPTS;

    // Call the service to fetch all news
    const result = await NewsService.fetchAllNews(maxAttempts);

    // Respond with the result as JSON
    res.status(200).json(result);
  } catch (error) {
    // Log and respond with error if something goes wrong
    console.error("Error in fetchNews:", error);
    res.status(500).json({
      error: "Failed to fetch news data",
      details: error.message,
    });
  }
};

// ===================== Exports =====================
// Export the fetchNews controller method
module.exports = {
  fetchNews,
};
