const GapService = require("../services/gap/gapService");
const { GAP_CONFIG } = require("../utils/constants");

class GapController {
  static async fetchGapUntilTarget(req, res) {
    try {
      const targetCount =
        (req.body && req.body.targetCount) ||
        GAP_CONFIG.DEFAULT_TARGET_COUNT ||
        518;
      const maxAttempts =
        (req.body && req.body.maxAttempts) ||
        GAP_CONFIG.DEFAULT_MAX_ATTEMPTS ||
        5;

      const result = await GapService.fetchGapUntilTarget(
        targetCount,
        maxAttempts
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error in fetchGapUntilTarget:", error);
      return res.status(500).json({
        message: "Failed to fetch gap until target",
        error: error.message,
      });
    }
  }
}

module.exports = {
  fetchGapUntilTarget: GapController.fetchGapUntilTarget,
};
