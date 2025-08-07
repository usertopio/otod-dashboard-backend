const DurianGardensService = require("../services/durianGardens/durianGardensService");
const { DURIAN_GARDENS_CONFIG } = require("../utils/constants");

// 🌿 Modern controller following farmers template
class DurianGardensController {
  static async fetchDurianGardens(req, res) {
    try {
      const targetCount =
        (req.body && req.body.targetCount) ||
        DURIAN_GARDENS_CONFIG.DEFAULT_TARGET_COUNT;
      const maxAttempts =
        (req.body && req.body.maxAttempts) ||
        DURIAN_GARDENS_CONFIG.DEFAULT_MAX_ATTEMPTS;

      const result = await DurianGardensService.fetchDurianGardens(
        targetCount,
        maxAttempts
      );

      return res.status(200).json(result);
    } catch (err) {
      console.error("Error in fetchDurianGardens:", err);
      return res.status(500).json({
        message: "Failed to fetch durian gardens",
        error: err.message,
      });
    }
  }
}

// 🌿 Export only the modern function
module.exports = {
  fetchDurianGardens: DurianGardensController.fetchDurianGardens,
};
