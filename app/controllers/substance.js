// ===================== Imports =====================
// Import the SubstanceService for business logic
const SubstanceService = require("../services/substance/substanceService");
const { SUBSTANCE_CONFIG } = require("../utils/constants");

// ===================== Controller =====================
// Handles HTTP requests for substance-related operations
class SubstanceController {
  /**
   * Handle POST /fetchSubstance
   * Fetches substance usage summary from the API and stores it in the database.
   * Accepts optional targetCount and maxAttempts in the request body.
   */
  static async fetchSubstance(req, res) {
    try {
      const targetCount =
        (req.body && req.body.targetCount) ||
        SUBSTANCE_CONFIG.DEFAULT_TARGET_COUNT;
      const maxAttempts =
        (req.body && req.body.maxAttempts) ||
        SUBSTANCE_CONFIG.DEFAULT_MAX_ATTEMPTS;

      const result = await SubstanceService.fetchSubstance(
        targetCount,
        maxAttempts
      );

      return res.status(200).json(result);
    } catch (err) {
      console.error("Error in fetchSubstance:", err);
      return res.status(500).json({
        message: "Failed to fetch substance",
        error: err.message,
      });
    }
  }
}

// ===================== Exports =====================
module.exports = {
  fetchSubstance: SubstanceController.fetchSubstance,
};
