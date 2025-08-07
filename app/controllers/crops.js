const CropsService = require("../services/crops/cropsService");
const { CROPS_CONFIG } = require("../utils/constants");

// 🔧 Modern controller following farmers template
class CropsController {
  static async fetchCrops(req, res) {
    try {
      // 🔧 Add fallback values in case CROPS_CONFIG is undefined
      const targetCount =
        (req.body && req.body.targetCount) ||
        (CROPS_CONFIG && CROPS_CONFIG.DEFAULT_TARGET_COUNT) ||
        10; // Fallback value

      const maxAttempts =
        (req.body && req.body.maxAttempts) ||
        (CROPS_CONFIG && CROPS_CONFIG.DEFAULT_MAX_ATTEMPTS) ||
        3; // Fallback value

      const result = await CropsService.fetchCrops(targetCount, maxAttempts);

      return res.status(200).json(result);
    } catch (err) {
      console.error("Error in fetchCrops:", err);
      return res.status(500).json({
        message: "Failed to fetch crops",
        error: err.message,
      });
    }
  }
}

// 🔧 Export only the modern function
module.exports = {
  fetchCrops: CropsController.fetchCrops,
};
