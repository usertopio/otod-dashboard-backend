const { getCrops } = require("../services/api/crops.js");

exports.fetchCrops = async (req, res) => {
  try {
    // You can get these from req.body or use defaults
    const {
      cropYear = 2024,
      provinceName = "",
      pageIndex = 1,
      pageSize = 500,
    } = req.body || {};

    const requestBody = {
      cropYear,
      provinceName,
      pageIndex,
      pageSize,
    };

    const customHeaders = {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    };

    const crops = await getCrops(requestBody, customHeaders);

    res.json({ crops });
  } catch (error) {
    console.error("Error fetching crops:", error);
    res.status(500).json({ error: "Failed to fetch crops" });
  }
};
