const apiClient = require("./apiClient.js");

// Outsource doc: API Name: GetMerchants
const getMerchants = async (requestBody, customHeaders = {}) => {
  const res = await apiClient.post("/api/report/GetMerchants", requestBody, {
    headers: {
      ...customHeaders,
    },
  });
  return res.data;
};

module.exports = { getMerchants };
