// services/api/login.js (ESM)
import axios from "axios";

// Outsource doc: API Name: Login
export async function login() {
  const requestBody = {
    username: process.env.API_USERNAME,
    password: process.env.API_PASSWORD,
  };

  // Use axios directly instead of apiClient to avoid circular dependency
  const response = await axios.post(
    `${process.env.OUTSOURCE_API_BASE_URL}/api/JWT/Login`,
    requestBody,
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  return response.data;
}
