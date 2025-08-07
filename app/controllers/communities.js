// ===================== Imports =====================
// Import the CommunitiesService for business logic
const CommunitiesService = require("../services/communities/communitiesService");
const { COMMUNITIES_CONFIG } = require("../utils/constants");

// ===================== Controller =====================
// Handles HTTP requests for community-related operations
const fetchCommunities = async (req, res) => {
  try {
    // Get targetCount and maxAttempts from request body or use defaults
    const targetCount =
      req.body.targetCount || COMMUNITIES_CONFIG.DEFAULT_TARGET_COUNT;
    const maxAttempts =
      req.body.maxAttempts || COMMUNITIES_CONFIG.DEFAULT_MAX_ATTEMPTS;

    // Call the service to fetch communities with the specified parameters
    const result = await CommunitiesService.fetchCommunities(
      targetCount,
      maxAttempts
    );

    // Respond with the result as JSON
    res.status(200).json(result);
  } catch (error) {
    // Log and respond with error if something goes wrong
    console.error("Error in fetchCommunities:", error);
    res.status(500).json({
      error: "Failed to fetch communities data",
      details: error.message,
    });
  }
};

// ===================== Exports =====================
// Export the fetchCommunities controller method
module.exports = {
  fetchCommunities,
};
