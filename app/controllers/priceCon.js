// ===================== Imports =====================
import AvgPriceService from "../services/price/priceService.js";
import { PRICE_CONFIG } from "../utils/constants.js";

// ===================== Controller =====================
// Handles HTTP requests for avg price-related operations
class PriceController {
  /**
   * Handle POST /fetchAvgPrice
   * Fetches avg price data from the API and stores it in the database.
   * Accepts optional maxAttempts in the request body.
   */
  static async fetchAvgPrice(req, res) {
    try {
      // Get maxAttempts from request body or use default
      const maxAttempts =
        req.body.maxAttempts || PRICE_CONFIG.DEFAULT_MAX_ATTEMPTS;

      // Call the service to fetch avg price records
      const result = await AvgPriceService.fetchAllAvgPrices(maxAttempts);

      // Respond with the result as JSON
      return res.status(200).json(result);
    } catch (error) {
      // Log and respond with error if something goes wrong
      console.error("Error in fetchAvgPrice:", error);
      return res.status(500).json({
        error: "Failed to fetch avg price data",
        details: error.message,
      });
    }
  }
}

// ===================== Exports =====================
export const fetchAvgPrice = PriceController.fetchAvgPrice;
