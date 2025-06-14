const axios = require("axios");
const apiConfig = require("../../config/api.conf.js");

// Create an Axios instance with the base URL and headers from the config
const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  headers: apiConfig.headers,
});

// Outsource doc: API Name: GetFarmers
const getFarmers = async (payload) => {
  const res = await apiClient.post("/api/report/GetFarmers", payload);
  return res.data;
};

module.exports = { getFarmers };
