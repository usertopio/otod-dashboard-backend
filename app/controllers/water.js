const { getWaterUsageSummaryByMonth } = require("../services/api/water.js");
const { insertWaterUsageSummaryByMonth } = require("../services/db/waterDb.js");

exports.fetchWaterUsageSummaryByMonth = async (req, res) => {
  try {
    // Prepare request body and headers as needed
    let requestBody = {
      cropYear: 2024,
      provinceName: "",
    };
    let customHeaders = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    };

    let WaterUsageSummaryByMonth = await getWaterUsageSummaryByMonth(
      requestBody,
      customHeaders
    );

    WaterUsageSummaryByMonth.data.forEach(insertWaterUsageSummaryByMonth);

    res.json({ WaterUsageSummaryByMonth: WaterUsageSummaryByMonth.data });
  } catch (error) {
    console.error("Error fetching WaterUsageSummaryByMonth:", error);
    res.status(500).json({ error: "Failed to fetch WaterUsageSummaryByMonth" });
  }
};
