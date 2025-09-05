// ===================== Imports =====================
// Import the WaterService for business logic
import WaterService from "../services/water/waterService.js";
import { WATER_CONFIG } from "../utils/constants.js";

// ===================== Controller =====================
// Handles HTTP requests for water-related operations
export const fetchWater = async (req, res) => {
  try {
    // Get maxAttempts from request body or use default
    const maxAttempts =
      (req.body && req.body.maxAttempts) || WATER_CONFIG.DEFAULT_MAX_ATTEMPTS;

    // Call the service to fetch all water records
    const result = await WaterService.fetchAllWater(maxAttempts);

    // Respond with the result as JSON
    res.status(200).json(result);
  } catch (err) {
    // Log and respond with error if something goes wrong
    console.error("Error in fetchWater:", err);
    res.status(500).json({
      message: "Failed to fetch water",
      error: err.message,
    });
  }
};
