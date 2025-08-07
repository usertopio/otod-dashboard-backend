// ===================== Imports =====================
// Import the GapService for business logic
const GapService = require("../services/gap/gapService");
const { GAP_CONFIG } = require("../utils/constants");

// ===================== Controller =====================
// Handles HTTP requests for GAP-related operations
class GapController {
  /**
   * Handle POST /fetchGap
   * Fetches GAP certificates from the API and stores them in the database.
   * Accepts optional targetCount and maxAttempts in the request body.
   */
  static async fetchGap(req, res) {
    try {
      const targetCount =
        (req.body && req.body.targetCount) || GAP_CONFIG.DEFAULT_TARGET_COUNT;
      const maxAttempts =
        (req.body && req.body.maxAttempts) || GAP_CONFIG.DEFAULT_MAX_ATTEMPTS;

      const result = await GapService.fetchGap(targetCount, maxAttempts);

      return res.status(200).json(result);
    } catch (err) {
      console.error("Error in fetchGap:", err);
      return res.status(500).json({
        message: "Failed to fetch gap",
        error: err.message,
      });
    }
  }
}

// ===================== Exports =====================
module.exports = {
  fetchGap: GapController.fetchGap,
};
