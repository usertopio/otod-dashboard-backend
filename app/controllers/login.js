const { login } = require("../services/api/login.js");

exports.toLogin = async (req, res) => {
  try {
    let requestBody = {
      username: process.env.OUTSOURCE_USERNAME,
      password: process.env.OUTSOURCE_PASSWORD,
    };

    let userInfo = await login(requestBody); // or login(wrappedBody)
    console.log("User Info:", userInfo);

    res.json({
      message: "Login successful",
      userInfo: userInfo,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ error: "Login failed" });
  }
};
