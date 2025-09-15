import apiClient from "./apiClient.js";

// Outsource doc: API Name: GetMerchants
export const getMerchants = async (requestBody, customHeaders = {}) => {
  const res = await apiClient.post("/api/report/GetMerchants", requestBody, {
    headers: { ...customHeaders },
  });
  return res.data;
};
