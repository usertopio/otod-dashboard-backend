const apiClient = require("./apiClient.js");

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
