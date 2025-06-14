const axios = require("axios");
const apiConfig = require("../../config/api.conf.js");

// Create an Axios instance with the base URL and headers from the config
const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  headers: apiConfig.headers,
});

// Outsource doc: API Name: Login
const login = async (reqBody) => {
  const res = await apiClient.post("/api/report/GetFarmers", reqBody);
  return res.data;
};

// Outsource doc: API Name: GetFarmers
const getFarmers = async (customReqBody, customHeaders = {}) => {
  const res = await apiClient.post("/api/report/GetFarmers", customReqBody, {
    headers: {
      ...customHeaders,
    },
  });
  return res.data;
};

module.exports = { getFarmers };
