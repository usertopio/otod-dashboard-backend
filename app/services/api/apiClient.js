const axios = require("axios");
const apiConfig = require("../../config/api/api.conf.js");

// Create an Axios instance with the base URL and headers from the config
const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  headers: apiConfig.headers,
});

module.exports = apiClient;
