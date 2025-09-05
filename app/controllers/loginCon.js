// controllers/authController.js (ESM)
import { login } from "../services/api/login.js";

export async function getToken(req, res) {
  try {
    const requestBody = {
      username: process.env.OUTSOURCE_USERNAME,
      password: process.env.OUTSOURCE_PASSWORD,
    };

    const userInfo = await login(requestBody);
    console.log("User Info:", userInfo);

    res.json({
      message: "Login successful",
      userInfo,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Login failed" });
  }
}
