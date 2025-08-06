const GapService = require("../services/gap/gapService");
const { GAP_CONFIG } = require("../utils/constants");

class GapController {
  static async fetchGapUntilTarget(req, res) {
    try {
      const targetCount =
        (req.body && req.body.targetCount) || GAP_CONFIG.DEFAULT_TARGET_COUNT;
      const maxAttempts =
        (req.body && req.body.maxAttempts) || GAP_CONFIG.DEFAULT_MAX_ATTEMPTS;

      const result = await GapService.fetchGapUntilTarget(
        targetCount,
        maxAttempts
      );

      return res.status(200).json(result);
    } catch (err) {
      console.error("Error in fetchGapUntilTarget:", err);
      return res.status(500).json({
        message: "Failed to fetch gap until target",
        error: err.message,
      });
    }
  }
}

module.exports = {
  fetchGapUntilTarget: GapController.fetchGapUntilTarget,
};
