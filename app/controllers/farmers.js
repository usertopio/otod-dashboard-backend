const FarmersService = require("../services/farmers/farmersService");
const { FARMERS_CONFIG } = require("../utils/constants");

class FarmersController {
  static async fetchFarmers(req, res) {
    try {
      const targetCount =
        (req.body && req.body.targetCount) ||
        FARMERS_CONFIG.DEFAULT_TARGET_COUNT;
      const maxAttempts =
        (req.body && req.body.maxAttempts) ||
        FARMERS_CONFIG.DEFAULT_MAX_ATTEMPTS;

      const result = await FarmersService.fetchFarmers(
        targetCount,
        maxAttempts
      );

      return res.status(200).json(result);
    } catch (err) {
      console.error("Error in fetchFarmers:", err);
      return res.status(500).json({
        message: "Failed to fetch farmers",
        error: err.message,
      });
    }
  }
}

module.exports = {
  fetchFarmers: FarmersController.fetchFarmers,
};
