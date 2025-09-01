const axios = require("axios");

// Outsource doc: API Name: Login
const login = async () => {
  const requestBody = {
    username: process.env.API_USERNAME,
    password: process.env.API_PASSWORD,
  };

  // Use axios directly instead of apiClient to avoid circular dependency
  const response = await axios.post(
    `${process.env.OUTSOURCE_API_BASE_URL}/api/JWT/Login`,
    requestBody,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

module.exports = { login };
