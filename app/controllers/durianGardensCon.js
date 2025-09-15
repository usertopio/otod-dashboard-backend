// ===================== Imports =====================
// Import the DurianGardensService for business logic
import DurianGardensService from "../services/durianGardens/durianGardensService.js";
import { DURIAN_GARDENS_CONFIG } from "../utils/constants.js";

// ===================== Controller =====================
// Handles HTTP requests for durian garden-related operations
export const fetchDurianGardens = async (req, res) => {
  try {
    // Get maxAttempts from request body or use default
    const maxAttempts =
      (req.body && req.body.maxAttempts) ||
      DURIAN_GARDENS_CONFIG.DEFAULT_MAX_ATTEMPTS;

    // Call the service to fetch all durian gardens
    const result = await DurianGardensService.fetchAllDurianGardens(
      maxAttempts
    );

    // Respond with the result as JSON
    res.status(200).json(result);
  } catch (err) {
    // Log and respond with error if something goes wrong
    console.error("Error in fetchDurianGardens:", err);
    res.status(500).json({
      message: "Failed to fetch durian gardens",
      error: err.message,
    });
  }
};
