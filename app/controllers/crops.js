const CropsService = require("../services/crops/cropsService");
const { CROPS_CONFIG } = require("../utils/constants");

// 🔧 Modern controller following farmers template
class CropsController {
  static async fetchCropsUntilTarget(req, res) {
    try {
      const targetCount =
        (req.body && req.body.targetCount) || CROPS_CONFIG.DEFAULT_TARGET_COUNT;
      const maxAttempts =
        (req.body && req.body.maxAttempts) || CROPS_CONFIG.DEFAULT_MAX_ATTEMPTS;

      console.log(
        `🎯 Starting fetchCropsUntilTarget - Target: ${targetCount}, Max attempts: ${maxAttempts}`
      );

      const result = await CropsService.fetchCropsUntilTarget(
        targetCount,
        maxAttempts
      );

      return res.status(200).json(result);
    } catch (err) {
      console.error("Error in fetchCropsUntilTarget:", err);
      return res.status(500).json({
        message: "Failed to fetch crops until target",
        error: err.message,
      });
    }
  }
}

// 🔧 Export only the modern function
module.exports = {
  fetchCropsUntilTarget: CropsController.fetchCropsUntilTarget,
};
