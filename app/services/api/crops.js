const apiClient = require("./apiClient.js");

// Outsource doc: API Name: GetCrops
const getCrops = async (requestBody, customHeaders = {}) => {
  const res = await apiClient.post("/api/report/GetCrops", requestBody, {
    headers: {
      ...customHeaders,
    },
  });
  return res.data;
};

// Outsource doc: API Name: GetCropSummary
const getCropSummary = async (requestBody, customHeaders = {}) => {
  const res = await apiClient.post("/api/report/GetCropSummary", requestBody, {
    headers: {
      ...customHeaders,
    },
  });
  return res.data;
};

module.exports = { getCrops, getCropSummary };
