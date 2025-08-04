const WaterService = require("../services/water/waterService");
const { WATER_CONFIG } = require("../utils/constants");

class WaterController {
  static async fetchWater(req, res) {
    try {
      const targetCount =
        (req.body && req.body.targetCount) ||
        WATER_CONFIG.DEFAULT_TARGET_COUNT ||
        0;
      const maxAttempts =
        (req.body && req.body.maxAttempts) ||
        WATER_CONFIG.DEFAULT_MAX_ATTEMPTS ||
        1; // Only 1 attempt since no pagination

      const result = await WaterService.fetchWater(targetCount, maxAttempts);

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error in fetchWater:", error);
      return res.status(500).json({
        message: "Failed to fetch water",
        error: error.message,
      });
    }
  }
}

module.exports = {
  fetchWater: WaterController.fetchWater,
};
