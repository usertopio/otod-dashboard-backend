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

// Outsource doc: API Name: GetGAPSummary
const getGapSummary = async (requestBody, customHeaders = {}) => {
  const res = await apiClient.post("/api/report/GetGAPSummary", requestBody, {
    headers: {
      ...customHeaders,
    },
  });
  return res.data;
};

// Outsource doc: API Name: GetCropStageSummary
const getCropStageSummary = async (requestBody, customHeaders = {}) => {
  const res = await apiClient.post(
    "/api/report/GetCropStageSummary",
    requestBody,
    {
      headers: {
        ...customHeaders,
      },
    }
  );
  return res.data;
};

// Outsource doc: API Name: GetLands
const getCropHarvests = async (requestBody, customHeaders = {}) => {
  const res = await apiClient.post("/api/report/GetCropHarvests", requestBody, {
    headers: {
      ...customHeaders,
    },
  });
  return res.data;
};

module.exports = {
  getCrops,
  getCropSummary,
  getGapSummary,
  getCropStageSummary,
  getCropHarvests,
};
