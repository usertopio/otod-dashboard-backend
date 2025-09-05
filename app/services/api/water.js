// api/water.js (ESM)
import apiClient from "./apiClient.js";

// Outsource doc: API Name: GetWaterUsageSummaryByMonth
export async function getWaterUsageSummaryByMonth(
  requestBody,
  customHeaders = {}
) {
  const res = await apiClient.post(
    "/api/report/GetWaterUsageSummaryByMonth",
    requestBody,
    { headers: { ...customHeaders } }
  );
  return res.data;
}
