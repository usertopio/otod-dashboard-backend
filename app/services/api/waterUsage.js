const apiClient = require("./apiClient.js");

// Outsource doc: API Name: GetWaterUsageSummaryByCrop
const getWaterUsageSummaryByCrop = async (requestBody, customHeaders = {}) => {
  const res = await apiClient.post(
    "/api/report/GetWaterUsageSummaryByCrop",
    requestBody,
    {
      headers: {
        ...customHeaders,
      },
    }
  );
  return res.data;
};

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
  getWaterUsageSummaryByCrop,
  getWaterUsageSummaryByMonth,
};
