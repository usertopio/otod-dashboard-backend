const axios = require("axios");
const apiConfig = require("../config/api.conf.js");

// const apiClient = axios.create({
//   baseURL: apiConfig.baseURL,
//   headers: apiConfig.headers,
// });

const getFarmers = async (payload) => {
  const res = await axios.post(
    `${apiConfig.baseURL}/api/report/GetFarmers`,
    payload,
    { headers: apiConfig.headers }
  );
  return res.data;
  //   return "Hello";
};

module.exports = { getFarmers };
