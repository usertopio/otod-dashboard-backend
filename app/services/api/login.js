const apiClient = require("./apiClient.js");

// Outsource doc: API Name: Login
const login = async (reqBody) => {
  const res = await apiClient.post("/api/report/GetFarmers", reqBody);
  return res.data;
};
