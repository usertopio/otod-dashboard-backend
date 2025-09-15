// api/lands.js (ESM)
import apiClient from "./apiClient.js";

// Outsource doc: API Name: GetLands
export const getLands = async (requestBody, customHeaders = {}) => {
  const res = await apiClient.post("/api/report/GetLands", requestBody, {
    headers: { ...customHeaders },
  });
  return res.data;
};
