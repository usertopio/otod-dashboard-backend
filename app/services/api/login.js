const apiClient = require("./apiClient.js");

// Outsource doc: API Name: Login
const login = async (reqBody) => {
  const res = await apiClient.post("/api/JWT/Login", reqBody);
  return res.data;
};

module.exports = { login };
