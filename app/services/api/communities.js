// communities.js (ESM)
import apiClient from "./apiClient.js";

// Outsource doc: API Name: GetCommunities
export const getCommunities = async (requestBody, customHeaders = {}) => {
  const res = await apiClient.post("/api/report/GetCommunities", requestBody, {
    headers: { ...customHeaders },
  });
  return res.data;
};
