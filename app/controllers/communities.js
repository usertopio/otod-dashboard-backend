const CommunitiesService = require("../services/communities/communitiesService");
const { COMMUNITIES_CONFIG } = require("../utils/constants");

class CommunitiesController {
  static async fetchCommunitiesUntilTarget(req, res) {
    try {
      const targetCount =
        (req.body && req.body.targetCount) ||
        COMMUNITIES_CONFIG.DEFAULT_TARGET_COUNT;
      const maxAttempts =
        (req.body && req.body.maxAttempts) ||
        COMMUNITIES_CONFIG.DEFAULT_MAX_ATTEMPTS;

      const result = await CommunitiesService.fetchCommunitiesUntilTarget(
        targetCount,
        maxAttempts
      );

      return res.status(200).json(result);
    } catch (err) {
      console.error("Error in fetchCommunitiesUntilTarget:", err);
      return res.status(500).json({
        message: "Failed to fetch communities until target",
        error: err.message,
      });
    }
  }
}

module.exports = {
  fetchCommunitiesUntilTarget:
    CommunitiesController.fetchCommunitiesUntilTarget,
};
