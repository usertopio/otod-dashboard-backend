// ===================== Imports =====================
// Import the MerchantsService for business logic
const MerchantsService = require("../services/merchants/merchantsService");
const { MERCHANTS_CONFIG } = require("../utils/constants");

// ===================== Controller =====================
// Handles HTTP requests for merchant-related operations
const fetchMerchants = async (req, res) => {
  try {
    // Get targetCount and maxAttempts from request body or use defaults
    const targetCount =
      req.body.targetCount || MERCHANTS_CONFIG.DEFAULT_TARGET_COUNT;
    const maxAttempts =
      req.body.maxAttempts || MERCHANTS_CONFIG.DEFAULT_MAX_ATTEMPTS;

    // Log the start of the fetch operation
    console.log(
      `Starting fetchMerchants with target: ${targetCount}, max attempts: ${maxAttempts}`
    );

    // Call the service to fetch merchants with the specified parameters
    const result = await MerchantsService.fetchMerchants(
      targetCount,
      maxAttempts
    );

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
