const apiClient = require("./apiClient.js");

// Outsource doc: API Name: GetLands
const getLands = async (requestBody, customHeaders = {}) => {
  const res = await apiClient.post("/api/report/GetLands", requestBody, {
    headers: {
      ...customHeaders,
    },
  });
  return res.data;
};

module.exports = { getLands };
