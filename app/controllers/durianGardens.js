const DurianGardensService = require("../services/durianGardens/durianGardensService");
const { DURIAN_GARDENS_CONFIG } = require("../utils/constants");

// 🌿 Modern controller following farmers template
class DurianGardensController {
  static async fetchDurianGardensUntilTarget(req, res) {
    try {
      const targetCount =
        (req.body && req.body.targetCount) ||
        DURIAN_GARDENS_CONFIG.DEFAULT_TARGET_COUNT;
      const maxAttempts =
        (req.body && req.body.maxAttempts) ||
        DURIAN_GARDENS_CONFIG.DEFAULT_MAX_ATTEMPTS;

      console.log(
        `🌿 Starting fetchDurianGardensUntilTarget - Target: ${targetCount}, Max attempts: ${maxAttempts}`
      );

      const result = await DurianGardensService.fetchDurianGardensUntilTarget(
        targetCount,
        maxAttempts
      );

      return res.status(200).json(result);
    } catch (err) {
      console.error("Error in fetchDurianGardensUntilTarget:", err);
      return res.status(500).json({
        message: "Failed to fetch durian gardens until target",
        error: err.message,
      });
    }
  }
}

// 🌿 Export only the modern function
module.exports = {
  fetchDurianGardensUntilTarget:
    DurianGardensController.fetchDurianGardensUntilTarget,
};
