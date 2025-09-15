import axios from "axios";
import tokenManager from "../../utils/tokenManager.js";

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.OUTSOURCE_API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  async (config) => {
    // Skip token for login requests
    if (config.url?.includes("/JWT/Login")) return config;

    try {
      const token = await tokenManager.getToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error("Failed to get token for request:", error.message);
      throw error;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiry
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log("🔄 Token expired, refreshing...");
      try {
        await tokenManager.refreshToken();

        // Retry the original request with a fresh token
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

export default apiClient;
