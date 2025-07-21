const {
  getWaterUsageSummaryByCrop,
  getWaterUsageSummaryByMonth,
} = require("../services/api/waterUsage.js");
const {
  insertWaterUsageSummaryByCrop,
  insertWaterUsageSummaryByMonth,
} = require("../services/db/waterUsageDb.js");

exports.fetchWaterUsageSummaryByCrop = async (req, res) => {
  try {
    // Prepare the request body for the API request
    let requestBody = {
      cropYear: 2024,
      provinceName: "",
    };

    // Custom headers for the API request
    let customHeaders = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    };

    // Fetch land summary from the outsource API
    let waterUsageSummaryByCrop = await getWaterUsageSummaryByCrop(
      requestBody,
      customHeaders
    );

    // Insert the land summary into the database one by one
    waterUsageSummaryByCrop.data.forEach(insertWaterUsageSummaryByCrop);

    res.json({ waterUsageSummaryByCrop: waterUsageSummaryByCrop });
  } catch (error) {
    console.error("Error fetching WaterUsageSummaryByCrop:", error);
    res.status(500).json({ error: "Failed to fetch WaterUsageSummaryByCrop" });
  }
};

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

    res.json({ WaterUsageSummaryByMonth: WaterUsageSummaryByMonth });
  } catch (error) {
    console.error("Error fetching WaterUsageSummaryByMonth:", error);
    res.status(500).json({ error: "Failed to fetch WaterUsageSummaryByMonth" });
  }
};
