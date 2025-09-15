import apiClient from "./apiClient.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getCrops(requestBody, customHeaders = {}, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await apiClient.post("/api/report/GetCrops", requestBody, {
        headers: { ...customHeaders },
      });
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
  throw new Error("Max retries exceeded for GetCrops");
}

export async function getCropHarvests(
  requestBody,
  customHeaders = {},
  retries = 3
) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await apiClient.post(
        "/api/report/GetCropHarvests",
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
  throw new Error("Max retries exceeded for GetCropHarvests");
}
