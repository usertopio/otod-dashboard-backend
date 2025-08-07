// ===================== Imports =====================
// Import the WaterService for business logic
const WaterService = require("../services/water/waterService");
const { WATER_CONFIG } = require("../utils/constants");

// ===================== Controller =====================
// Handles HTTP requests for water-related operations
class WaterController {
  /**
   * Handle POST /fetchWater
   * Fetches water usage summary from the API and stores it in the database.
   * Accepts optional targetCount and maxAttempts in the request body.
   */
  static async fetchWater(req, res) {
    try {
      const targetCount =
        (req.body && req.body.targetCount) || WATER_CONFIG.DEFAULT_TARGET_COUNT;
      const maxAttempts =
        (req.body && req.body.maxAttempts) || WATER_CONFIG.DEFAULT_MAX_ATTEMPTS;

      const result = await WaterService.fetchWater(targetCount, maxAttempts);

      return res.status(200).json(result);
    } catch (err) {
      console.error("Error in fetchWater:", err);
      return res.status(500).json({
        message: "Failed to fetch water",
        error: err.message,
      });
    }
  }
}

// ===================== Exports =====================
module.exports = {
  fetchWater: WaterController.fetchWater,
};
