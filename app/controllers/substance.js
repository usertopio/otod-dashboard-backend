// ===================== Imports =====================
// Import the SubstanceService for business logic
const SubstanceService = require("../services/substance/substanceService");
const { SUBSTANCE_CONFIG } = require("../utils/constants");

// ===================== Controller =====================
// Handles HTTP requests for substance-related operations
const fetchSubstance = async (req, res) => {
  try {
    // Get maxAttempts from request body or use default
    const maxAttempts =
      (req.body && req.body.maxAttempts) ||
      SUBSTANCE_CONFIG.DEFAULT_MAX_ATTEMPTS;

    // Call the service to fetch all substance records
    const result = await SubstanceService.fetchAllSubstance(maxAttempts);

    // Respond with the result as JSON
    res.status(200).json(result);
  } catch (err) {
    // Log and respond with error if something goes wrong
    console.error("Error in fetchSubstance:", err);
    res.status(500).json({
      message: "Failed to fetch substance",
      error: err.message,
    });
  }
};

// ===================== Exports =====================
module.exports = {
  fetchSubstance,
};
