// ===================== Imports =====================
// Import the CommunitiesService for business logic
import CommunitiesService from "../services/communities/communitiesService.js";
import { COMMUNITIES_CONFIG } from "../utils/constants.js";

// ===================== Controller =====================
// Handles HTTP requests for community-related operations
export const fetchCommunities = async (req, res) => {
  try {
    // Get maxAttempts from request body or use default
    const maxAttempts =
      req.body.maxAttempts || COMMUNITIES_CONFIG.DEFAULT_MAX_ATTEMPTS;

    // Call the service to fetch all communities
    const result = await CommunitiesService.fetchAllCommunities(maxAttempts);

    // Respond with the result as JSON
    res.status(200).json(result);
  } catch (error) {
    // Log and respond with error if something goes wrong
    console.error("Error in fetchCommunities:", error);
    res.status(500).json({
      error: "Failed to fetch communities data",
      details: error.message,
    });
  }
};
