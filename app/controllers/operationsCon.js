// ===================== Imports =====================
// Import the OperationsService for business logic
import OperationsService from "../services/operations/operationsService.js";
import { OPERATIONS_CONFIG } from "../utils/constants.js";

// ===================== Controller =====================
// Handles HTTP requests for operation-related actions
export const fetchOperations = async (req, res) => {
  try {
    // Get maxAttempts from request body or use default
    const maxAttempts =
      (req.body && req.body.maxAttempts) ||
      OPERATIONS_CONFIG.DEFAULT_MAX_ATTEMPTS;

    // Call the service to fetch all operations
    const result = await OperationsService.fetchAllOperations(maxAttempts);

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
