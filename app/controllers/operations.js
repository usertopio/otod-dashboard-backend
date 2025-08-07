// ===================== Imports =====================
// Import the OperationsService for business logic
const OperationsService = require("../services/operations/operationsService");
const { OPERATIONS_CONFIG } = require("../utils/constants");

// ===================== Controller =====================
// Handles HTTP requests for operation-related actions
const fetchOperations = async (req, res) => {
  try {
    // Get targetCount and maxAttempts from request body or use defaults
    const targetCount =
      (req.body && req.body.targetCount) ||
      OPERATIONS_CONFIG.DEFAULT_TARGET_COUNT;
    const maxAttempts =
      (req.body && req.body.maxAttempts) ||
      OPERATIONS_CONFIG.DEFAULT_MAX_ATTEMPTS;

    // Log the start of the fetch operation
    console.log(
      `Starting fetchOperations with target: ${targetCount}, max attempts: ${maxAttempts}`
    );

    // Call the service to fetch operations with the specified parameters
    const result = await OperationsService.fetchOperations(
      targetCount,
      maxAttempts
    );

    res.status(200).json(result);
  } catch (error) {
    // Log and respond with error if something goes wrong
    console.error("Error in fetchOperations:", error);
    res.status(500).json({
      error: "Failed to fetch operations data",
      details: error.message,
    });
  }
};

// ===================== Exports =====================
// Export the fetchOperations controller method
module.exports = {
  fetchOperations,
};
