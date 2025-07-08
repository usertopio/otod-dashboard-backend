const apiClient = require("./apiClient.js");

// Outsource doc: API Name: GetCommunities
const getCommunities = async (requestBody, customHeaders = {}) => {
  const res = await apiClient.post("/api/report/GetCommunities", requestBody, {
    headers: {
      ...customHeaders,
    },
  });
  return res.data;
};

// Outsource doc: API Name: GetCommunitySummary
const getCommunitySummary = async (customHeaders = {}) => {
  const res = await apiClient.get("/api/report/GetCommunitySummary", {
    headers: {
      ...customHeaders,
    },
  });
  return res.data;
};

module.exports = { getCommunities, getCommunitySummary };
