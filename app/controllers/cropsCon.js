// ===================== Imports =====================
// Import the CropsService for business logic
import CropsService from "../services/crops/cropsService.js";
import { CROPS_CONFIG } from "../utils/constants.js";

// ===================== Controller =====================
// Handles HTTP requests for crop-related operations
export const fetchCrops = async (req, res) => {
  try {
    // Safely get maxAttempts from request body or use default
    const maxAttempts =
      (req.body && req.body.maxAttempts) || CROPS_CONFIG.DEFAULT_MAX_ATTEMPTS;

    // Call the service to fetch all crops
    const result = await CropsService.fetchAllCrops(maxAttempts);

    // Respond with the result as JSON
    res.status(200).json(result);
  } catch (error) {
    // Log and respond with error if something goes wrong
    console.error("Error in fetchCrops:", error);
    res.status(500).json({
      error: "Failed to fetch crops data",
      details: error.message,
    });
  }
};
