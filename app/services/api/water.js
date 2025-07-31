const apiClient = require("./apiClient.js");

// Outsource doc: API Name: GetWaterUsageSummaryByMonth
const getWaterUsageSummaryByMonth = async (requestBody, customHeaders = {}) => {
  const res = await apiClient.post(
    "/api/report/GetWaterUsageSummaryByMonth",
    requestBody,
    {
      headers: {
        ...customHeaders,
      },
    }
  );
  return res.data;
};

module.exports = {
  getWaterUsageSummaryByMonth,
};
