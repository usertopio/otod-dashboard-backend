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
