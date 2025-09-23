// ===================== Imports =====================
import { syncFarmersFromApi } from "../services/farmers/farmersService.js";

// ===================== Controller =====================
// Handles HTTP requests for farmer-related operations
class FarmersController {
  /**
   * Handle POST /fetchFarmers
   * Fetches farmers from the API and stores them in the database.
   */
  static async fetchFarmers(req, res) {
    try {
      console.log("🚦 API called: /api/fetchFarmers");
      const result = await syncFarmersFromApi();
      return res.status(200).json(result);
    } catch (err) {
      console.error("Error in fetchFarmers:", err);
      return res.status(500).json({
        message: "Failed to fetch farmers",
        error: err.message,
      });
    }
  }
}

// ===================== Exports =====================
export const fetchFarmers = FarmersController.fetchFarmers;
