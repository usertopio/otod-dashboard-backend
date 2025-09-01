// ===================== Imports =====================
// Import the GapService for business logic
const GapService = require("../services/gap/gapService");
const { GAP_CONFIG } = require("../utils/constants");

// ===================== Controller =====================
// Handles HTTP requests for GAP-related operations
const fetchGap = async (req, res) => {
  try {
    // Get maxAttempts from request body or use default
    const maxAttempts =
      (req.body && req.body.maxAttempts) || GAP_CONFIG.DEFAULT_MAX_ATTEMPTS;

    // Call the service to fetch all GAP certificates
    const result = await GapService.fetchAllGap(maxAttempts);

    // Respond with the result as JSON
    res.status(200).json(result);
  } catch (err) {
    // Log and respond with error if something goes wrong
    console.error("Error in fetchGap:", err);
    res.status(500).json({
      message: "Failed to fetch gap",
      error: err.message,
    });
  }
};

// ===================== Exports =====================
module.exports = {
  fetchGap,
};
