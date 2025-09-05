// api/operations.js (ESM)
import apiClient from "./apiClient.js";

// Helper: sleep for ms
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Outsource doc: API Name: GetOperations
export async function getOperations(
  requestBody,
  customHeaders = {},
  retries = 3
) {
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
}
