const FarmersService = require("../services/farmers/farmersService");
const { FARMERS_CONFIG } = require("../utils/constants");

class FarmersController {
  static async fetchFarmersUntilTarget(req, res) {
    try {
      const targetCount =
        (req.body && req.body.targetCount) ||
        FARMERS_CONFIG.DEFAULT_TARGET_COUNT;
      const maxAttempts =
        (req.body && req.body.maxAttempts) ||
        FARMERS_CONFIG.DEFAULT_MAX_ATTEMPTS;

      const result = await FarmersService.fetchFarmersUntilTarget(
        targetCount,
        maxAttempts
      );

      return res.status(200).json(result);
    } catch (err) {
      console.error("Error in fetchFarmersUntilTarget:", err);
      return res.status(500).json({
        message: "Failed to fetch farmers until target",
        error: err.message,
      });
    }
  }
}

module.exports = {
  fetchFarmersUntilTarget: FarmersController.fetchFarmersUntilTarget,
};
