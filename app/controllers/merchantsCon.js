// ===================== Imports =====================
// Import the MerchantsService for business logic
const MerchantsService = require("../services/merchants/merchantsService");
const { MERCHANTS_CONFIG } = require("../utils/constants");

// ===================== Controller =====================
// Handles HTTP requests for merchant-related operations
const fetchMerchants = async (req, res) => {
  try {
    // Get maxAttempts from request body or use default
    const maxAttempts =
      (req.body && req.body.maxAttempts) ||
      MERCHANTS_CONFIG.DEFAULT_MAX_ATTEMPTS;

    // Call the service to fetch all merchants
    const result = await MerchantsService.fetchAllMerchants(maxAttempts);

    // Respond with the result as JSON
    res.status(200).json(result);
  } catch (error) {
    // Log and respond with error if something goes wrong
    console.error("Error in fetchMerchants:", error);
    res.status(500).json({
      error: "Failed to fetch merchants data",
      details: error.message,
    });
  }
};

// ===================== Exports =====================
// Export the fetchMerchants controller method
module.exports = {
  fetchMerchants,
};
