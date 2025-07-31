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

module.exports = { getCommunities };
