import tokenManager from "../utils/tokenManager.js";

/**
 * Get current token status
 */
export async function getTokenStatus(req, res) {
  try {
    const isValid = tokenManager.isTokenValid();
    const token = tokenManager.cachedToken;

    res.status(200).json({
      hasToken: !!token,
      isValid: isValid,
      token: token ? `${token.substring(0, 10)}...` : null, // Show partial token for security
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get token status",
      error: error.message,
    });
  }
}

/**
 * Force refresh the token
 */
export async function refreshToken(req, res) {
  try {
    const token = await tokenManager.refreshToken();
    res.status(200).json({
      message: "Token refreshed successfully",
      token: `${token.substring(0, 10)}...`, // Show partial token for security
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to refresh token",
      error: error.message,
    });
  }
}
