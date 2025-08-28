const apiClient = require("./apiClient.js");

// Helper function to sleep for a given number of milliseconds
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Outsource doc: API Name: GetOperations
const getOperations = async (requestBody, customHeaders = {}, retries = 3) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await apiClient.post(
        "/api/report/GetOperations",
        requestBody,
        {
          headers: { ...customHeaders },
        }
      );
      return res.data;
    } catch (err) {
      if (err.response && err.response.status === 429) {
        const retryAfter =
          parseInt(err.response.headers["retry-after"] || "60", 10) * 1000;
        console.warn(
          `Rate limited. Waiting ${retryAfter / 1000}s before retrying...`
        );
        await sleep(retryAfter);
      } else {
        throw err;
      }
    }
  }
  throw new Error("Max retries exceeded for GetOperations");
};

module.exports = { getOperations };
