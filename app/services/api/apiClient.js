const axios = require("axios");
const apiConfig = require("../../config/api/api.conf.js");
const tokenManager = require("../../utils/tokenManager");

// Create an Axios instance with the base URL and headers from the config
const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  headers: apiConfig.headers,
});

// Create an axios interceptor to automatically add the token
apiClient.interceptors.request.use(
  async (config) => {
    // Skip token for login requests
    if (config.url?.includes("/JWT/Login")) {
      return config;
    }

    try {
      const token = await tokenManager.getToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error("Failed to get token for request:", error.message);
      throw error;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiry
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log("🔄 Token expired, refreshing...");
      try {
        await tokenManager.refreshToken();
        // Retry the original request
        const originalRequest = error.config;
        const token = await tokenManager.getToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError.message);
        throw error;
      }
    }
    return Promise.reject(error);
  }
);

module.exports = apiClient;
