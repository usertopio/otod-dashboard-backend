// ===================== Imports =====================
// Import the DurianGardensService for business logic
const DurianGardensService = require("../services/durianGardens/durianGardensService");
const { DURIAN_GARDENS_CONFIG } = require("../utils/constants");

// ===================== Controller =====================
// Handles HTTP requests for durian garden-related operations
class DurianGardensController {
  /**
   * Handle POST /fetchDurianGardens
   * Fetches durian gardens from APIs and stores them in the database.
   * Accepts optional targetCount and maxAttempts in the request body.
   */
  static async fetchDurianGardens(req, res) {
    try {
      // Get targetCount and maxAttempts from request body or use defaults
      const targetCount =
        (req.body && req.body.targetCount) ||
        DURIAN_GARDENS_CONFIG.DEFAULT_TARGET_COUNT;
      const maxAttempts =
        (req.body && req.body.maxAttempts) ||
        DURIAN_GARDENS_CONFIG.DEFAULT_MAX_ATTEMPTS;

      // Call the service to fetch durian gardens with the specified parameters
      const result = await DurianGardensService.fetchDurianGardens(
        targetCount,
        maxAttempts
      );

      // Respond with the result as JSON
      return res.status(200).json(result);
    } catch (err) {
      // Log and respond with error if something goes wrong
      console.error("Error in fetchDurianGardens:", err);
      return res.status(500).json({
        message: "Failed to fetch durian gardens",
        error: err.message,
      });
    }
  }
}

// ===================== Exports =====================
// Export the fetchDurianGardens controller method
module.exports = {
  fetchDurianGardens: DurianGardensController.fetchDurianGardens,
};
