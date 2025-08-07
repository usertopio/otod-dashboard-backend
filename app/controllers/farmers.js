// ===================== Imports =====================
const FarmersService = require("../services/farmers/farmersService");
const { FARMERS_CONFIG } = require("../utils/constants");

// ===================== Controller =====================
// Handles HTTP requests for farmer-related operations
class FarmersController {
  /**
   * Handle POST /fetchFarmers
   * Fetches farmers from the API and stores them in the database.
   * Accepts optional targetCount and maxAttempts in the request body.
   */
  static async fetchFarmers(req, res) {
    try {
      // Get targetCount and maxAttempts from request body or use defaults
      const targetCount =
        (req.body && req.body.targetCount) ||
        FARMERS_CONFIG.DEFAULT_TARGET_COUNT;
      const maxAttempts =
        (req.body && req.body.maxAttempts) ||
        FARMERS_CONFIG.DEFAULT_MAX_ATTEMPTS;

      // Call the service to fetch farmers with the specified parameters
      const result = await FarmersService.fetchFarmers(
        targetCount,
        maxAttempts
      );

      // Respond with the result as JSON
      return res.status(200).json(result);
    } catch (err) {
      // Log and respond with error if something goes wrong
      console.error("Error in fetchFarmers:", err);
      return res.status(500).json({
        message: "Failed to fetch farmers",
        error: err.message,
      });
    }
  }
}

// ===================== Exports =====================
module.exports = {
  fetchFarmers: FarmersController.fetchFarmers,
};
