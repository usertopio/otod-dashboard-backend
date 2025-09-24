// ===================== Imports =====================
// Import the DurianGardensService for business logic
import { syncDurianGardensFromApi } from "../services/durianGardens/durianGardensService.js";

// ===================== Controller =====================
// Handles HTTP requests for durian garden-related operations
export const fetchDurianGardens = async (req, res) => {
  try {
    console.log("🚦 API called: /api/fetchDurianGardens");
    const result = await syncDurianGardensFromApi();
    res.status(200).json(result);
  } catch (err) {
    console.error("Error in fetchDurianGardens:", err);
    res.status(500).json({
      message: "Failed to fetch durian gardens",
      error: err.message,
    });
  }
};
