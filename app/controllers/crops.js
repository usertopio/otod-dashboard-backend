// ===================== Imports =====================
// Import the CropsService for business logic
const CropsService = require("../services/crops/cropsService");
const { CROPS_CONFIG } = require("../utils/constants");

// ===================== Controller =====================
// Handles HTTP requests for crop-related operations
class CropsController {
  /**
   * Handle POST /fetchCrops
   * Fetches crops from APIs and stores them in the database.
   * Accepts optional targetCount and maxAttempts in the request body.
   */
  static async fetchCrops(req, res) {
    try {
      // Get targetCount and maxAttempts from request body or use defaults
      const targetCount =
        (req.body && req.body.targetCount) ||
        (CROPS_CONFIG && CROPS_CONFIG.DEFAULT_TARGET_COUNT) ||
        10; // Fallback value

      const maxAttempts =
        (req.body && req.body.maxAttempts) ||
        (CROPS_CONFIG && CROPS_CONFIG.DEFAULT_MAX_ATTEMPTS) ||
        3; // Fallback value

      // Call the service to fetch crops with the specified parameters
      const result = await CropsService.fetchCrops(targetCount, maxAttempts);

      // Respond with the result as JSON
      return res.status(200).json(result);
    } catch (err) {
      // Log and respond with error if something goes wrong
      console.error("Error in fetchCrops:", err);
      return res.status(500).json({
        message: "Failed to fetch crops",
        error: err.message,
      });
    }
  }
}

// ===================== Exports =====================
// Export the fetchCrops controller method
module.exports = {
  fetchCrops: CropsController.fetchCrops,
};
