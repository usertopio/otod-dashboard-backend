import AvgPriceService from "../services/avgPrice/avgPriceService.js";

export const fetchAvgPrice = async (req, res) => {
  try {
    const requestBody = req.body || {};
    const result = await AvgPriceService.fetchAllAvgPrices(requestBody);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in fetchAvgPrice:", error);
    res.status(500).json({
      error: "Failed to fetch avg price data",
      details: error.message,
    });
  }
};
