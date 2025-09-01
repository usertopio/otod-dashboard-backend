const { login } = require("../services/api/login");

class TokenManager {
  constructor() {
    this.cachedToken = null;
    this.tokenExpiry = 0;
    this.refreshBuffer = 60000; // 60 seconds buffer before expiry
  }

  /**
   * Fetches a new token from the API
   * @returns {Promise<string>} The access token
   */
  async fetchToken() {
    try {
      console.log("🔑 Fetching new token...");

      // Use your existing login service
      const response = await login();

      if (response && response.accessToken) {
        this.cachedToken = response.accessToken;

        // Calculate expiry time (assuming expiresIn is in seconds)
        const expiresIn = response.expiresIn || 3600; // Default 1 hour
        this.tokenExpiry = Date.now() + expiresIn * 1000 - this.refreshBuffer;

        console.log("✅ Token fetched successfully");
        return this.cachedToken;
      } else {
        throw new Error("Invalid token response");
      }
    } catch (error) {
      console.error("❌ Failed to fetch token:", error.message);
      throw error;
    }
  }

  /**
   * Gets a valid token, fetching a new one if needed
   * @returns {Promise<string>} A valid access token
   */
  async getToken() {
    // Check if we need a new token
    if (!this.cachedToken || Date.now() > this.tokenExpiry) {
      await this.fetchToken();
    }

    return this.cachedToken;
  }

  /**
   * Forces a token refresh
   * @returns {Promise<string>} A new access token
   */
  async refreshToken() {
    this.cachedToken = null;
    this.tokenExpiry = 0;
    return await this.getToken();
  }

  /**
   * Clears the cached token
   */
  clearToken() {
    this.cachedToken = null;
    this.tokenExpiry = 0;
  }

  /**
   * Checks if the current token is valid
   * @returns {boolean} True if token is valid
   */
  isTokenValid() {
    return this.cachedToken && Date.now() <= this.tokenExpiry;
  }
}

// Export a singleton instance
module.exports = new TokenManager();
