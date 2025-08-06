const SubstanceService = require("../services/substance/substanceService");
const { SUBSTANCE_CONFIG } = require("../utils/constants");

// 🔧 KEEP: Legacy method for backward compatibility
const {
  getSubstanceUsageSummaryByMonth,
} = require("../services/api/substance.js");
const {
  insertSubstanceUsageSummaryByMonth,
} = require("../services/db/substanceDb.js");

exports.fetchSubstanceUsageSummaryByMonth = async (req, res) => {
  try {
    // Prepare request body and headers as needed
    let requestBody = {
      cropYear: 2024,
      provinceName: "",
    };
    let customHeaders = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    };

    let substanceUsageSummaryByMonth = await getSubstanceUsageSummaryByMonth(
      requestBody,
      customHeaders
    );

    substanceUsageSummaryByMonth.data.forEach(
      insertSubstanceUsageSummaryByMonth
    );

    res.json({
      substanceUsageSummaryByMonth: substanceUsageSummaryByMonth.data,
    });
  } catch (error) {
    console.error("Error fetching SubstanceUsageSummaryByMonth:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch SubstanceUsageSummaryByMonth" });
  }
};

// 🔧 NEW: Modern class-based controller (same as water)
class SubstanceController {
  static async fetchSubstanceUntilTarget(req, res) {
    try {
      const targetCount =
        (req.body && req.body.targetCount) ||
        SUBSTANCE_CONFIG.DEFAULT_TARGET_COUNT;
      const maxAttempts =
        (req.body && req.body.maxAttempts) ||
        SUBSTANCE_CONFIG.DEFAULT_MAX_ATTEMPTS;

      const result = await SubstanceService.fetchSubstanceUntilTarget(
        targetCount,
        maxAttempts
      );

      return res.status(200).json(result);
    } catch (err) {
      console.error("Error in fetchSubstanceUntilTarget:", err);
      return res.status(500).json({
        message: "Failed to fetch substance until target",
        error: err.message,
      });
    }
  }
}

module.exports = {
  fetchSubstanceUntilTarget: SubstanceController.fetchSubstanceUntilTarget,
};
