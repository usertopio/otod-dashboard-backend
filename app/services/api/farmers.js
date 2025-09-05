// api/farmers.js (ESM)
import apiClient from "./apiClient.js";

// Outsource doc: API Name: GetFarmers
export const getFarmers = async (requestBody, customHeaders = {}) => {
  const res = await apiClient.post("/api/report/GetFarmers", requestBody, {
    headers: { ...customHeaders },
  });
  return res.data;
};
