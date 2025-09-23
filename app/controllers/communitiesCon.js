// ===================== Imports =====================
// Import the CommunitiesService for business logic
import { syncCommunitiesFromApi } from "../services/communities/communitiesService.js";
import { COMMUNITIES_CONFIG } from "../utils/constants.js";

// ===================== Controller =====================
// Handles HTTP requests for community-related operations
export const fetchCommunities = async (req, res) => {
  try {
    console.log("🚦 API called: /api/fetchCommunities");
    const result = await syncCommunitiesFromApi();
    res.status(200).json(result);
  } catch (err) {
    console.error("Error in fetchCommunities:", err);
    res.status(500).json({
      message: "Failed to fetch communities",
      error: err.message,
    });
  }
};
