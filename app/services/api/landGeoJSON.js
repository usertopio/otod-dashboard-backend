const apiClient = require("./apiClient.js");

const getLandGeoJSON = async (requestBody, customHeaders = {}) => {
  const res = await apiClient.post("/api/report/GetLandGeoJSON", requestBody, {
    headers: {
      ...customHeaders,
    },
  });
  return res.data;
};

module.exports = { getLandGeoJSON };
