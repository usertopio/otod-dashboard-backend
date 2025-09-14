import apiClient from "./apiClient.js";

// Outsource doc: API Name: GetAvgPriceByDate
export const getAvgPriceByDate = async (requestBody, customHeaders = {}) => {
  const res = await apiClient.post(
    "/api/report/GetAvgPriceByDate",
    requestBody,
    {
      headers: { ...customHeaders },
    }
  );
  return res.data;
};
