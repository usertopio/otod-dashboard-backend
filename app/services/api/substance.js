const apiClient = require("./apiClient.js");

// Outsource doc: API Name: GetSubstanceUsageSummaryByMonth
const getSubstanceUsageSummaryByMonth = async (
  requestBody,
  customHeaders = {}
) => {
  const res = await apiClient.post(
    "/api/report/GetSubstanceUsageSummaryByMonth",
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
  getSubstanceUsageSummaryByMonth,
};
