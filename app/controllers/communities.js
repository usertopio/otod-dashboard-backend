const CommunitiesService = require("../services/communities/communitiesService");
const { COMMUNITIES_CONFIG } = require("../utils/constants");

// 🔧 EXACT SAME PATTERN AS fetchFarmersUntilTarget
exports.fetchCommunitiesUntilTarget = async (req, res) => {
  try {
    const targetCount =
      req.body.targetCount || COMMUNITIES_CONFIG.DEFAULT_TARGET_COUNT;
    const maxAttempts =
      req.body.maxAttempts || COMMUNITIES_CONFIG.DEFAULT_MAX_ATTEMPTS;

    const result = await CommunitiesService.fetchCommunitiesUntilTarget(
      targetCount,
      maxAttempts
    );

    res.json(result);
  } catch (error) {
    console.error("Error in fetchCommunitiesUntilTarget:", error);
    res.status(500).json({
      error: "Failed to fetch communities until target",
      details: error.message,
    });
  }
};

// Keep your existing methods
exports.fetchCommunities = async (req, res) => {
  // ... your existing fetchCommunities code
};
