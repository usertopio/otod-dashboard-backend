const apiClient = require("./apiClient.js");

// Outsource doc: API Name: GetFarmers
const getFarmers = async (requestBody, customHeaders = {}) => {
  const res = await apiClient.post("/api/report/GetFarmers", requestBody, {
    headers: {
      ...customHeaders,
    },
  });
  return res.data;
};

// Outsource doc: API Name: GetFarmerSummary
const GetFarmerSummary = async (customHeaders = {}) => {
  const res = await apiClient.get("/api/report/GetFarmerSummary", {
    headers: {
      ...customHeaders,
    },
  });
  return res.data;
};

module.exports = { getFarmers, GetFarmerSummary };
