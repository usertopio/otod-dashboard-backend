const axios = require("axios");
const apiConfig = require("../../config/api.conf.js");

const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  headers: apiConfig.headers,
});

const getFarmers = async (payload) => {
  const res = await apiClient.post("/api/report/GetFarmers", payload);
  return res.data;
};

module.exports = { getFarmers };
