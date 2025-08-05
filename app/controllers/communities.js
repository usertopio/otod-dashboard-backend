const CommunitiesService = require("../services/communities/communitiesService");
const { COMMUNITIES_CONFIG } = require("../utils/constants");

const fetchCommunitiesUntilTarget = async (req, res) => {
  try {
    const targetCount =
      req.body.targetCount || COMMUNITIES_CONFIG.DEFAULT_TARGET_COUNT;
    const maxAttempts =
      req.body.maxAttempts || COMMUNITIES_CONFIG.DEFAULT_MAX_ATTEMPTS;

    console.log(
      `Starting fetchCommunitiesUntilTarget with target: ${targetCount}, max attempts: ${maxAttempts}`
    );

    const result = await CommunitiesService.fetchCommunitiesUntilTarget(
      targetCount,
      maxAttempts
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in fetchCommunitiesUntilTarget:", error);
    res.status(500).json({
      error: "Failed to fetch communities data",
      details: error.message,
    });
  }
};

module.exports = {
  fetchCommunitiesUntilTarget,
};
