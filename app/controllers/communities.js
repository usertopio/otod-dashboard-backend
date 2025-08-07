const CommunitiesService = require("../services/communities/communitiesService");
const { COMMUNITIES_CONFIG } = require("../utils/constants");

const fetchCommunities = async (req, res) => {
  try {
    const targetCount =
      req.body.targetCount || COMMUNITIES_CONFIG.DEFAULT_TARGET_COUNT;
    const maxAttempts =
      req.body.maxAttempts || COMMUNITIES_CONFIG.DEFAULT_MAX_ATTEMPTS;

    console.log(
      `Starting fetchCommunities with target: ${targetCount}, max attempts: ${maxAttempts}`
    );

    const result = await CommunitiesService.fetchCommunities(
      targetCount,
      maxAttempts
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in fetchCommunities:", error);
    res.status(500).json({
      error: "Failed to fetch communities data",
      details: error.message,
    });
  }
};

module.exports = {
  fetchCommunities,
};
