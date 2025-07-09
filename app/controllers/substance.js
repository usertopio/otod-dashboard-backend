const {
  getSubstanceUsageSummaryByCrop,
  getSubstanceUsageSummaryByMonth,
} = require("../services/api/substance.js");
const {
  insertSubstanceUsageSummaryByCrop,
  insertSubstanceUsageSummaryByMonth,
} = require("../services/db/substanceDb.js");

exports.fetchSubstanceUsageSummaryByCrop = async (req, res) => {
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
    let substanceUsageSummaryByCrop = await getSubstanceUsageSummaryByCrop(
      requestBody,
      customHeaders
    );

    // Insert the land summary into the database one by one
    substanceUsageSummaryByCrop.data.forEach(insertSubstanceUsageSummaryByCrop);

    res.json({ substanceUsageSummaryByCrop: substanceUsageSummaryByCrop });
  } catch (error) {
    console.error("Error fetching SubstanceUsageSummaryByCrop:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch SubstanceUsageSummaryByCrop" });
  }
};

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

    res.json({ substanceUsageSummaryByMonth: substanceUsageSummaryByMonth });
  } catch (error) {
    console.error("Error fetching SubstanceUsageSummaryByMonth:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch SubstanceUsageSummaryByMonth" });
  }
};
